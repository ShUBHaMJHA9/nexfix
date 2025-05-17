from fastapi import FastAPI, Query, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from passlib.context import CryptContext
from dotenv import load_dotenv
from urllib.parse import unquote
import psycopg2
from psycopg2 import Error
import os
import aiohttp
from fastapi import HTTPException
from urllib.parse import urlencode
from typing import List, Optional
from datetime import datetime
from typing import Optional
import logging
from api.sql import create_connection
# Load environment variables
import aiohttp
load_dotenv()
from api.create import initialize_database

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# FastAPI app initialization
home_app = FastAPI(title="Nexfix Home API", version="3.0", docs_url="/docs")

# CORS configuration
home_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
BASE_URL = os.getenv("BASE_URL")
WEB_URL = os.getenv("WEB_URL")
if not all([DATABASE_URL, BASE_URL, WEB_URL]):
    raise ValueError("DATABASE_URL, BASE_URL, and WEB_URL must be set in environment variables")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Valid categories
VALID_CATEGORIES = [
    "hero", "hollywood", "hindi dubbed south", "hindi dubbed", "bollywood",
    "bengali", "web series", "marathi", "punjabi", "action", "tamil",
    "kids", "top movie", "coming-soon"
]

# Pydantic models for request validation
class TrailerRequest(BaseModel):
    video_id: str = Field(..., min_length=8, max_length=8)
    movie_title: str = Field(..., min_length=1)
    trailer_url: Optional[str] = None
    trailer_source: Optional[str] = "YouTube"
    trailer_duration: Optional[int] = None

class ReviewRequest(BaseModel):
    video_id: str = Field(..., min_length=8, max_length=8)
    movie_title: str = Field(..., min_length=1)
    user_name: str = Field(default="Anonymous", min_length=1)
    user_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    review_text: str = Field(..., min_length=1)

# Initialize database on startup
@home_app.on_event("startup")
async def startup_event():
    initialize_database()

# Utility function
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Routes
@home_app.get("/info")
async def get_info():
    return JSONResponse(content={"message": "Welcome to the Home API"})

@home_app.get("/images")
async def get_images():
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT unique_id, name, poster_path FROM movies")
            results = cur.fetchall()
        image_list = [
            {
                "id": row[0],
                "name": row[1],
                "poster_url": os.path.join(BASE_URL, row[2].lstrip("/")) if row[2] else "https://via.placeholder.com/1280x720"
            }
            for row in results if row[2]
        ]
        return {"images": image_list}
    except Error as e:
        logger.error(f"Error in get_images: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

@home_app.post("/signup")
async def signup(name: str = Form(...), email: str = Form(...), password: str = Form(...)):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Check for existing email
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Insert new user
            hashed_pw = hash_password(password)
            cur.execute(
                "INSERT INTO users (name, email, hashed_password) VALUES (%s, %s, %s) RETURNING id",
                (name, email, hashed_pw)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            return {"message": "Signup successful", "user_id": user_id}
    except Error as e:
        logger.error(f"Error in signup: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

@home_app.get("/details")
async def details(
    genre: str = Query(None, description="Filter by genre (e.g., Action)"),
    category: str = Query(None, description="Filter by category (e.g., hollywood, bollywood)"),
    limit: int = Query(10, ge=1, description="Number of movies to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    search: str = Query(None, description="Search by movie name")
):
    return await get_movie_details(genre=genre, category=category, limit=limit, offset=offset, search=search)

@home_app.get("/search")
async def search(q: str = Query(..., description="Search query for movie name")):
    return await get_movie_details(search=q, limit=10, offset=0)

@home_app.get("/details/{id}")
async def get_movie_by_id(id: str):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            query = """
                SELECT 
                    m.unique_id, m.name, m.description, m.rating, m.poster_path, 
                    m.category, m.release_year, m.genre, t.trailer_url,
                    COALESCE(AVG(r.rating)::FLOAT, 0) AS avg_rating,
                    COALESCE(COUNT(r.id), 0) AS review_count,
                    m.media_type, m.live
                FROM movies m
                LEFT JOIN movie_trailers t ON m.unique_id = t.video_id
                LEFT JOIN movie_reviews r ON m.unique_id = r.video_id
                WHERE m.unique_id = %s
                GROUP BY m.unique_id, m.name, m.description, m.rating, m.poster_path,
                         m.category, m.release_year, m.genre, t.trailer_url,
                         m.media_type, m.live
            """
            cur.execute(query, (id,))
            result = cur.fetchone()
            
            if not result:
                raise HTTPException(status_code=404, detail="Movie not found")
                
            (
                unique_id, name, description, rating, poster_path, category,
                release_year, genre, trailer_url, avg_rating, review_count,
                media_type, live
            ) = result

            movie = {
                "watchUrl": f"{WEB_URL}/watch?v={unique_id}",
                "title": name or "Unknown Title",
                "posterUrl": os.path.join(BASE_URL, poster_path.lstrip("/")) if poster_path else "https://via.placeholder.com/1280x720",
                "rating": rating if rating is not None else "N/A",
                "avgRating": round(avg_rating, 1) if avg_rating > 0 else "N/A",
                "reviewCount": review_count,
                "quality": "HD",
                "description": description or "No description available.",
                "category": category or "hero",
                "release_year": release_year or "N/A",
                "genre": genre or "Unknown",
                "trailerUrl": trailer_url or None,
                "media_type": media_type or "movie",
                "live": bool(live)
            }
            return movie
    except Error as e:
        logger.error(f"Database error in get_movie_by_id: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()


@home_app.get("/details/{id}/similar")
async def get_similar_movies(id: str, limit: int = Query(10, ge=1)):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Get the genre and category of the target movie
            cur.execute("SELECT genre, category FROM movies WHERE unique_id = %s", (id,))
            result = cur.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Movie not found")
            movie_genre, movie_category = result

            # Fetch similar movies based on genre or category
            query = """
                SELECT 
                    m.unique_id, m.name, m.description, m.rating, m.poster_path, 
                    m.category, m.release_year, m.genre, t.trailer_url,
                    COALESCE(AVG(r.rating)::FLOAT, 0) as avg_rating,
                    COALESCE(COUNT(r.id), 0) as review_count
                FROM movies m
                LEFT JOIN movie_trailers t ON m.unique_id = t.video_id
                LEFT JOIN movie_reviews r ON m.unique_id = r.video_id
                WHERE m.unique_id != %s
                AND (m.genre ILIKE %s OR m.category ILIKE %s)
                GROUP BY m.unique_id, m.name, m.description, m.rating, m.poster_path,
                         m.category, m.release_year, m.genre, t.trailer_url
                ORDER BY m.created_at DESC
                LIMIT %s
            """
            cur.execute(query, (id, f"%{movie_genre}%", movie_category, limit))
            results = cur.fetchall()
            
            movies = []
            for result in results:
                unique_id, name, description, rating, poster_path, category, release_year, genre, trailer_url, avg_rating, review_count = result
                movie = {
                    "watchUrl": f"{WEB_URL}/watch?v={unique_id}",
                    "title": name or "Unknown Title",
                    "posterUrl": os.path.join(BASE_URL, poster_path.lstrip("/")) if poster_path else "https://via.placeholder.com/1280x720",
                    "rating": rating if rating is not None else "N/A",
                    "avgRating": round(avg_rating, 1) if avg_rating > 0 else "N/A",
                    "reviewCount": review_count,
                    "quality": "HD",
                    "description": description or "No description available.",
                    "category": category or "hero",
                    "release_year": release_year or "N/A",
                    "genre": genre or "Unknown",
                    "trailerUrl": trailer_url or None
                }
                movies.append(movie)
            return movies
    except Error as e:
        logger.error(f"Database error in get_similar_movies: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

@home_app.post("/reviews")
async def add_review(review: ReviewRequest):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Verify movie exists
            cur.execute("SELECT name FROM movies WHERE unique_id = %s", (review.video_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Movie not found")
                
            query = """
                INSERT INTO movie_reviews (video_id, movie_title, user_name, user_id, rating, review_text, review_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            review_date = datetime.now()
            cur.execute(query, (
                review.video_id,
                review.movie_title,
                review.user_name,
                review.user_id,
                review.rating,
                review.review_text,
                review_date
            ))
            review_id = cur.fetchone()[0]
            conn.commit()
            return {"status": "success", "message": "Review added", "review_id": review_id}
    except Error as e:
        logger.error(f"Database error in add_review: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

@home_app.get("/reviews/{video_id}")
async def get_reviews(video_id: str):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            query = """
                SELECT id, video_id, movie_title, user_name, user_id, rating, review_text, review_date
                FROM movie_reviews
                WHERE video_id = %s
                ORDER BY review_date DESC
            """
            cur.execute(query, (video_id,))
            results = cur.fetchall()
            reviews = [{
                "id": r[0],
                "video_id": r[1],
                "movie_title": r[2],
                "user_name": r[3],
                "user_id": r[4],
                "rating": r[5],
                "review_text": r[6],
                "review_date": r[7].isoformat()
            } for r in results]
            return reviews
    except Error as e:
        logger.error(f"Database error in get_reviews: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

@home_app.post("/trailers")
async def add_trailer(trailer: TrailerRequest):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Verify movie exists
            cur.execute("SELECT name FROM movies WHERE unique_id = %s", (trailer.video_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Movie not found")
                
            # Validate trailer_url if provided
            if trailer.trailer_url and not trailer.trailer_url.startswith(("http://", "https://")):
                raise HTTPException(status_code=400, detail="Invalid trailer URL")
                
            query = """
                INSERT INTO movie_trailers (video_id, movie_title, trailer_url, trailer_source, trailer_duration)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (video_id) DO UPDATE
                SET trailer_url = EXCLUDED.trailer_url,
                    movie_title = EXCLUDED.movie_title,
                    trailer_source = EXCLUDED.trailer_source,
                    trailer_duration = EXCLUDED.trailer_duration
                RETURNING video_id
            """
            cur.execute(query, (
                trailer.video_id,
                trailer.movie_title,
                trailer.trailer_url,
                trailer.trailer_source,
                trailer.trailer_duration
            ))
            conn.commit()
            return {"status": "success", "message": "Trailer URL updated", "video_id": trailer.video_id}
    except Error as e:
        logger.error(f"Database error in add_trailer: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

@home_app.get("/trailers/{video_id}")
async def get_trailer(video_id: str):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            query = "SELECT trailer_url, trailer_source, trailer_duration FROM movie_trailers WHERE video_id = %s"
            cur.execute(query, (video_id,))
            result = cur.fetchone()
            if result and result[0]:
                return {
                    "trailer_url": result[0],
                    "trailer_source": result[1],
                    "trailer_duration": result[2]
                }
            return {"trailer_url": None, "trailer_source": None, "trailer_duration": None}
    except Error as e:
        logger.error(f"Database error in get_trailer: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

async def get_movie_details(genre=None, category=None, limit=10, offset=0, search=None):
    if category and category.lower() not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}"
        )

    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            query = """
                SELECT 
                    m.unique_id, m.name, m.description, m.rating, m.poster_path, 
                    m.category, m.release_year, m.genre, t.trailer_url,
                    COALESCE(AVG(r.rating)::FLOAT, 0) as avg_rating,
                    COALESCE(COUNT(r.id), 0) as review_count,
                    m.media_type,
                    m.live
                FROM movies m
                LEFT JOIN movie_trailers t ON m.unique_id = t.video_id
                LEFT JOIN movie_reviews r ON m.unique_id = r.video_id
                WHERE 1=1
            """
            params = []

            if genre:
                query += " AND m.genre ILIKE %s"
                params.append(f'%{genre}%')

            if category:
                query += " AND LOWER(m.category) ILIKE %s"
                params.append(category.lower())

            if search:
                query += " AND m.name ILIKE %s"
                params.append(f'%{search}%')

            query += """
                GROUP BY m.unique_id, m.name, m.description, m.rating, m.poster_path,
                         m.category, m.release_year, m.genre, t.trailer_url, m.media_type, m.live, m.created_at
                ORDER BY m.created_at DESC
                LIMIT %s OFFSET %s
            """
            params.extend([limit, offset])

            logger.debug(f"Executing query: {query} with params: {params}")
            cur.execute(query, params)
            results = cur.fetchall()

            movies = []
            for result in results:
                (
                    unique_id, name, description, rating, poster_path, category,
                    release_year, genre, trailer_url, avg_rating, review_count,
                    media_type, live
                ) = result

                movie = {
                    "watchUrl": f"{WEB_URL}/watch?v={unique_id}",
                    "title": name or "Unknown Title",
                    "posterUrl": os.path.join(BASE_URL, poster_path.lstrip("/")) if poster_path else "https://via.placeholder.com/1280x720",
                    "rating": rating if rating is not None else "N/A",
                    "avgRating": round(avg_rating, 1) if avg_rating > 0 else "N/A",
                    "reviewCount": review_count,
                    "quality": "HD",
                    "description": description or "No description available.",
                    "category": category or "hero",
                    "release_year": release_year or "N/A",
                    "genre": genre or "Unknown",
                    "duration": "N/A",  # Placeholder
                    "trailerUrl": trailer_url,
                    "media_type": media_type or "movie",
                    "live": bool(live)
                }
                movies.append(movie)

            logger.debug(f"Returning {len(movies)} movies")
            return movies

    except Exception as e:
        logger.error(f"Database error in get_movie_details: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    finally:
        conn.close()

class DownloadOption(BaseModel):
    quality: str
    url: str

@home_app.get("/downloads/{video_id}", response_model=List[DownloadOption])
async def get_download_options(video_id: str):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT movie_link FROM movies WHERE unique_id = %s", (video_id,))
            result = cur.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="Video not found")

            movie_link = result[0]

        # Construct the URL for `request_movie` API
        request_movie_url = f"http://localhost:8000/request-movie"
        params = {
            'url': f"{BASE_URL}{movie_link}",
            'user_id': 'shub'
        }

        # Step 1: Make internal API call to `request_movie`
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{request_movie_url}?{urlencode(params)}") as res:
                if res.status != 200:
                    raise HTTPException(status_code=res.status, detail="Movie API failed")

                movie_data = await res.json()

        # Process movie data from API response
        video_id_from_api = movie_data.get("video_id")
        stream_movie_url = f"http://localhost:8000/stream/{video_id_from_api}"

        # Step 2: Make internal API call to `stream_movie`
        async with aiohttp.ClientSession() as session:
            async with session.get(stream_movie_url) as res:
                if res.status != 200:
                    raise HTTPException(status_code=res.status, detail="Stream API failed")

                stream_data = await res.json()
                print(stream_data)
                sources = stream_data.get("sources", [])

        if not sources:
            raise HTTPException(status_code=404, detail="No video qualities found")

        # Step 3: Store the sources in the database
        with conn.cursor() as cur:
            for source in sources:
                quality = source.get("quality")
                url = unquote(source.get("url"))  # Decode the URL
                cur.execute(
                    "INSERT INTO download (movie_id, quality, url) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                    (video_id, quality, url)
                )
            conn.commit()

        # Step 4: Return download options to the user
        download_options = [
            DownloadOption(quality=source["quality"], url=f"{WEB_URL}/download/{video_id}/{source['quality']}")
            for source in sources
        ]
        return download_options


    except Exception as e:
        logger.error(f"Error in get_download_options: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

@home_app.get("/details/{video_id}/cast")
async def get_cast(video_id: str):  # Changed from int to str
    conn = create_connection()
    try:
        with conn.cursor() as cur:
            # Get movie_id from unique_id
            cur.execute("SELECT id FROM movies WHERE unique_id = %s", (video_id,))
            result = cur.fetchone()
            if not result:
                return JSONResponse(content=[], status_code=200)

            movie_id = result[0]

            # Fetch cast details using movie_id
            cur.execute(
                "SELECT name, role, image FROM casts WHERE movie_id = %s", (movie_id,)
            )
            rows = cur.fetchall()
            if rows:
                return [
                    {
                        "name": row[0],
                        "role": row[1],
                        "image": f"assets/images/{row[2]}"
                    }
                    for row in rows
                ]
            else:
                return [
                    {
                        "name": "Nexfix",
                        "role": "Lead",
                        "image": "assets/images/default-avatar.jpg"
                    }
                ]
    except Exception as e:
        print("Error fetching cast:", e)
        raise HTTPException(status_code=500, detail="Server error")
    finally:
        conn.close()

#code for fetching watchj url 
@home_app.get("/watch/{video_id}", response_model=List[DownloadOption])
async def get_watch_options(video_id: str):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT movie_link FROM movies WHERE unique_id = %s", (video_id,))
            result = cur.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="Video not found")

            movie_link = result[0]

        if not movie_link:
            raise HTTPException(status_code=400, detail="Movie link not available")

        request_movie_url = f"http://localhost:8000/request-movie"
        params = {
            'url': f"{BASE_URL}{movie_link}",
            'user_id': 'shub'
        }

        async with aiohttp.ClientSession() as session:
            # Step 1: request_movie API
            async with session.get(f"{request_movie_url}?{urlencode(params)}") as res:
                if res.status != 200:
                    raise HTTPException(status_code=res.status, detail="Movie API failed")
                movie_data = await res.json()

            # Step 2: stream_movie API
            video_id_from_api = movie_data.get("video_id")
            if not video_id_from_api:
                raise HTTPException(status_code=500, detail="Missing video_id from movie API")

            stream_movie_url = f"http://localhost:8000/stream/{video_id_from_api}"
            async with session.get(stream_movie_url) as res:
                if res.status != 200:
                    raise HTTPException(status_code=res.status, detail="Stream API failed")
                stream_data = await res.json()

        sources = stream_data.get("sources", [])
        if not sources:
            raise HTTPException(status_code=404, detail="No video qualities found")

        # Step 3: Store the sources
        with conn.cursor() as cur:
            for source in sources:
                quality = source.get("quality")
                url = unquote(source.get("url"))
                if quality and url:
                    cur.execute(
                        "INSERT INTO download (movie_id, quality, url) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                        (video_id, quality, url)
                    )
            conn.commit()

        # Step 4: Prepare response
        download_options = [
            DownloadOption(quality=source["quality"], url=unquote(source["url"]))
            for source in sources if source.get("quality") and source.get("url")
        ]

        return download_options

    except Exception as e:
        logger.error(f"Error in get_watch_options: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

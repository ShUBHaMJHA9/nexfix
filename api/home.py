from fastapi import FastAPI, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
from fastapi import FastAPI, Query
from api.sql import create_connection
import psycopg2
from urllib.parse import urljoin
from contextlib import closing
from psycopg2 import Error
...

# Load environment variables
load_dotenv()

# FastAPI home_home_app initialization
home_app = FastAPI(title="Nexfix Home API", version="3.0", docs_url="/docs")

# CORS configuration
home_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
BASE_URL = os.getenv("BASE_URL")

if not DATABASE_URL or not BASE_URL:
    raise ValueError("DATABASE_URL and BASE_URL must be set in environment variables")

Base = declarative_base()
# Keep create_engine for SQLAlchemy ORM operations
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

# Database initialization
def initialize_database():
    from api.sql import create_connection  # Moved import here to avoid circular imports
    conn = create_connection()
    if not conn:
        raise RuntimeError("Database connection failed")

    try:
        Base.metadata.create_all(bind=engine)  # Use SQLAlchemy engine for table creation
        # Add other initialization logic if needed
    except Exception as e:
        raise RuntimeError(f"Database initialization failed: {str(e)}")
    finally:
        conn.close()

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
        return {"error": "Database connection failed"}
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, poster_path FROM movies")
            results = cur.fetchall()

        # Filter out images with None or null poster_path
        image_list = [
            {
                "id": row[0],
                "name": row[1],
                "poster_url": os.path.join(BASE_URL, row[2])
            }
            for row in results if row[2]  # Exclude entries where poster_path is None
        ]

        return {"images": image_list}
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()
@home_app.post("/signup")
async def signup(name: str = Form(...), email: str = Form(...), password: str = Form(...)):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_pw = hash_password(password)
        user = User(name=name, email=email, hashed_password=hashed_pw)
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"message": "Signup successful", "user_id": user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# Valid categories
VALID_CATEGORIES = [
    "hero",
    "hollywood",
    "hindi dubbed south",
    "hindi dubbed",
    "bollywood",
    "bengali",
    "web series",
    "marathi",
    "punjabi",
    "action",
    "tamil",
    "kids",
    "top movie"
]

@home_app.get("/details")
async def details(
    genre: str = Query(None, description="Filter by genre (e.g., Action)"),
    category: str = Query(None, description="Filter by category (e.g., hollywood, bollywood)"),
    limit: int = Query(10, ge=1, description="Number of movies to return"),
    search: str = Query(None, description="Search by movie name")
):
    return await get_movie_details(genre=genre, category=category, limit=limit, search=search)


@home_app.get("/search")
async def search(q: str = Query(..., description="Search query for movie name")):
    return await get_movie_details(search=q, limit=10)
async def get_movie_details(genre=None, category=None, limit=10, search=None):
    if category and category.lower() not in VALID_CATEGORIES:
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}"}
        )

    conn = create_connection()
    if not conn:
        return JSONResponse(status_code=500, content={"error": "Database connection failed"})

    try:
        with conn.cursor() as cur:
            query = """
                SELECT unique_id, name, description, rating, poster_path, category, release_year
                FROM movies
                WHERE 1=1
            """
            params = []

            if genre:
                query += " AND genre ILIKE %s"
                params.append(f'%{genre}%')

            if category:
                query += " AND lower(category) ILIKE %s"
                params.append(category.lower())

            if search:
                query += " AND name ILIKE %s"
                params.append(f'%{search}%')

            query += " ORDER BY created_at DESC LIMIT %s"
            params.append(limit)

            cur.execute(query, params)
            results = cur.fetchall()

            movies = []
            for result in results:
                unique_id, name, description, rating, poster_path, category, release_year = result
                movie = {
                    "id": unique_id,
                    "title": name or "Unknown Title",
                    "posterUrl": os.path.join(BASE_URL, poster_path) if poster_path else "https://via.placeholder.com/1280x720",
                    "rating": rating if rating is not None else "N/A",
                    "quality": "HD",
                    "description": description or "No description available.",
                    "category": category or "hero",
                    "release_year": release_year or "N/A",
                    "watchUrl": f"{BASE_URL}/?watch={unique_id}"
                }
                movies.append(movie)

            return movies

    except Error as e:
        return JSONResponse(status_code=500, content={"error": f"Database error: {str(e)}"})
    finally:
        conn.close()


from psycopg2 import Error
from api.sql import create_connection
import logging

logger = logging.getLogger(__name__)

def initialize_database():
    """Initialize all required tables if they do not exist"""
    conn = create_connection()
    if not conn:
        raise RuntimeError("Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Users table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL
                )
            """)

            # Movies table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS movies (
                    unique_id VARCHAR(8) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    rating VARCHAR(10),
                    poster_path VARCHAR(255),
                    category VARCHAR(50),
                    release_year VARCHAR(4),
                    genre VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Movie trailers
            cur.execute("""
                CREATE TABLE IF NOT EXISTS movie_trailers (
                    video_id VARCHAR(8) PRIMARY KEY,
                    movie_title VARCHAR(255) NOT NULL,
                    trailer_url VARCHAR(255),
                    trailer_source VARCHAR(50),
                    trailer_duration INTEGER,
                    FOREIGN KEY (video_id) REFERENCES movies(unique_id)
                )
            """)

            # Movie reviews
            cur.execute("""
                CREATE TABLE IF NOT EXISTS movie_reviews (
                    id SERIAL PRIMARY KEY,
                    video_id VARCHAR(8) NOT NULL,
                    movie_title VARCHAR(255) NOT NULL,
                    user_name VARCHAR(255) NOT NULL,
                    user_id VARCHAR(255),
                    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    review_text TEXT NOT NULL,
                    review_date TIMESTAMP NOT NULL,
                    FOREIGN KEY (video_id) REFERENCES movies(unique_id)
                )
            """)

            # Casts table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS casts (
                    id SERIAL PRIMARY KEY,
                    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
                    name TEXT NOT NULL,
                    role TEXT DEFAULT 'Unknown',
                    image TEXT DEFAULT 'poster.jpg'
                )
            """)

            conn.commit()
            logger.info("All database tables initialized successfully.")

    except Error as e:
        logger.error(f"Database initialization failed: {e}")
        raise RuntimeError(f"Database initialization failed: {str(e)}")
    finally:
        conn.close()

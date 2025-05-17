import psycopg2
from psycopg2 import Error
from api.sql import create_connection

def setup_tables():
    """Creating movie_reviews and movie_trailers tables"""
    conn = create_connection()
    if not conn:
        print("Failed to connect to database")
        return

    try:
        with conn.cursor() as cur:
            # Creating movie_reviews table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS movie_reviews (
                    id SERIAL PRIMARY KEY,
                    video_id VARCHAR(8) NOT NULL,
                    movie_title TEXT NOT NULL,
                    user_name TEXT NOT NULL,
                    user_id VARCHAR(50), -- Future-proof: for user authentication
                    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    review_text TEXT NOT NULL,
                    is_verified BOOLEAN DEFAULT FALSE, -- Future-proof: for review moderation
                    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (video_id) REFERENCES movies(unique_id) ON DELETE CASCADE
                )
            """)

            # Creating movie_trailers table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS movie_trailers (
                    video_id VARCHAR(8) PRIMARY KEY,
                    movie_title TEXT NOT NULL,
                    trailer_url TEXT,
                    trailer_source TEXT, -- Future-proof: e.g., YouTube, Vimeo
                    trailer_duration INTEGER, -- Future-proof: duration in seconds
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (video_id) REFERENCES movies(unique_id) ON DELETE CASCADE
                )
            """)

        conn.commit()
        print("Tables created successfully")
    except Error as e:
        print(f"Error creating tables: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    setup_tables()

    try:
        async with session.head(url) as head_resp:
            if head_resp.status != 200:
                await session.close()
                raise HTTPException(status_code=head_resp.status, detail="Failed to fetch video header")
            
            total_size = int(head_resp.headers.get("Content-Length", 0))
            content_type = head_resp.headers.get("Content-Type", "video/mp4")

        start, end = 0, total_size - 1
        if range_header:
            range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
            if range_match:
                start = int(range_match.group(1))
                if range_match.group(2):
                    end = int(range_match.group(2)) or total_size - 1
                if start > end:
                    await session.close()
                    raise HTTPException(status_code=416, detail="Invalid range")

        headers = {"Range": f"bytes={start}-{end}"}

        async def stream_chunk():
            async with session.get(url, headers=headers) as resp:
                async for chunk in resp.content.iter_chunked(1024 * 1024 * 2):
                    yield chunk
            await session.close()

        return StreamingResponse(
            stream_chunk(),
            status_code=206 if range_header else 200,
            headers={
                "Content-Range": f"bytes {start}-{end}/{total_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(end - start + 1),
                "Content-Type": content_type,
                "Content-Disposition": f'attachment; filename="{token}.mp4"'
            }
        )
    except Exception:
        await session.close()
        raise


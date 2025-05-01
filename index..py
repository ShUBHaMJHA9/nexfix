from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import JSONResponse, HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
from pathlib import Path
import uvicorn
import secrets
import os
import aiohttp
import asyncio
import re
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor, execute_batch
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Constants
EXPIRY_MINUTES = 60
CHUNK_SIZE = 1024 * 512  # 512KB chunks

# Initialize FastAPI
app = FastAPI(title="StreamHub Pro", version="3.0", docs_url="/api/docs")
templates = Jinja2Templates(directory="templates")

# Database configuration
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("TEMBO_HOST"),
        port=os.getenv("TEMBO_PORT"),
        database=os.getenv("TEMBO_DB"),
        user=os.getenv("TEMBO_USER"),
        password=os.getenv("TEMBO_PASSWORD"),
        cursor_factory=RealDictCursor
    )

# Initialize database tables
def init_db():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS mov (
                    video_id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    sources JSONB NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    views INTEGER DEFAULT 0,
                    duration INTEGER NOT NULL,
                    subtitle TEXT,
                    thumbnail TEXT,
                    subtitle_file_path TEXT
                )
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp 
                ON movies (timestamp)
            """)
            conn.commit()

init_db()

# File management
TMP_DIR = Path("/tmp")
STATIC_PATH = TMP_DIR / "static"
SUBTITLE_PATH = STATIC_PATH / "subtitles"
SUBTITLE_PATH.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

async def download_file(url: str, dest: Path) -> bool:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as resp:
                if resp.status == 200:
                    dest.write_bytes(await resp.read())
                    return True
        return False
    except Exception as e:
        print(f"Download failed: {e}")
        return False

# Database operations
async def db_execute(query: str, params: tuple = None) -> Optional[List[Dict]]:
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                if query.strip().upper().startswith("SELECT"):
                    return cursor.fetchall()
                conn.commit()
                return None
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database operation failed")

async def cleanup_expired_entries():
    expiry_time = datetime.utcnow() - timedelta(minutes=EXPIRY_MINUTES)
    await db_execute(
        "DELETE FROM movies WHERE timestamp < %s",
        (expiry_time,)
    )

# Main endpoints
@app.get("/request-movie", response_class=JSONResponse)
async def request_stream(
    url: str = Query(...),
    user_id: str = Query(...),
    thumbnail_url: str = Query(None),
    subtitle_url: str = Query(None)
):
    video_id = secrets.token_urlsafe(16)
    timestamp = datetime.utcnow()
    
    # Handle subtitles
    subtitle_path = None
    if subtitle_url:
        sub_path = SUBTITLE_PATH / f"{video_id}.vtt"
        if await download_file(subtitle_url, sub_path):
            subtitle_path = f"/static/subtitles/{video_id}.vtt"

    # Handle thumbnails
    thumbnail_path = "/static/thumbnail.jpg"
    if thumbnail_url:
        thumb_path = STATIC_PATH / f"{video_id}.jpg"
        if await download_file(thumbnail_url, thumb_path):
            thumbnail_path = f"/static/{video_id}.jpg"

    # Fetch video sources
    sources = await fetch_sources(url)
    if not sources:
        raise HTTPException(status_code=400, detail="No valid sources found")

    # Database insertion
    await db_execute(
        """
        INSERT INTO movies (
            video_id, user_id, sources, timestamp,
            duration, subtitle, thumbnail, subtitle_file_path
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            video_id, user_id, json.dumps(sources), timestamp,
            max(s["duration"] for s in sources),
            subtitle_path, thumbnail_path,
            str(sub_path) if subtitle_path else None
        )
    )

    return {
        "video_id": video_id,
        "movie_url": f"/movie?video_id={video_id}",
        "expires_at": (timestamp + timedelta(minutes=EXPIRY_MINUTES)).isoformat()
    }

@app.get("/movie", response_class=HTMLResponse)
async def video_player(request: Request, video_id: str):
    return templates.TemplateResponse("player.html", {
        "request": request,
        "video_id": video_id
    })

@app.get("/stream/{video_id}", response_class=JSONResponse)
async def get_stream_data(video_id: str):
    # Cleanup expired entries first
    await cleanup_expired_entries()

    result = await db_execute(
        "SELECT * FROM movies WHERE video_id = %s",
        (video_id,)
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Content not found")

    entry = result[0]
    await db_execute(
        "UPDATE movies SET views = views + 1 WHERE video_id = %s",
        (video_id,)
    )

    return {
        "sources": [
            {"url": f"/stream-proxy/{video_id}?quality={s['quality']}", "quality": s["quality"]}
            for s in entry["sources"]
        ],
        "meta": {
            "duration": entry["duration"],
            "views": entry["views"] + 1,
            "resolution": "HD"
        },
        "subtitles": [{
            "label": "English",
            "lang": "en",
            "url": entry["subtitle"],
            "default": True
        }],
        "thumbnail": entry["thumbnail"]
    }

@app.get("/stream-proxy/{video_id}")
async def stream_proxy(video_id: str, quality: str, request: Request):
    result = await db_execute(
        "SELECT sources, timestamp FROM movies WHERE video_id = %s",
        (video_id,)
    )

    if not result:
        raise HTTPException(status_code=404, detail="Invalid video ID")

    entry = result[0]
    if datetime.utcnow() - entry["timestamp"] > timedelta(minutes=EXPIRY_MINUTES):
        raise HTTPException(status_code=403, detail="Stream expired")

    # Find source by quality
    selected_source = next((s for s in entry["sources"] if s["quality"] == quality), None)
    if not selected_source:
        raise HTTPException(status_code=404, detail="Quality not available")

    range_header = request.headers.get("range")
    print("Range header:", range_header)

    async with aiohttp.ClientSession() as session:
        async with session.head(selected_source["url"]) as head_resp:
            if head_resp.status != 200:
                raise HTTPException(status_code=head_resp.status, detail="Failed to fetch video header")
            total_size = int(head_resp.headers.get("Content-Length", 0))
            print("Total video size:", total_size)

    # Default byte range
    start = 0
    end = total_size - 1

    if range_header:
        range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if range_match:
            start = int(range_match.group(1))
            if range_match.group(2):
                end = int(range_match.group(2))
        if start > end:
            raise HTTPException(status_code=416, detail="Invalid range")

    headers = {
        "Range": f"bytes={start}-{end}"
    }

    async def stream_chunk():
        async with aiohttp.ClientSession() as session:
            async with session.get(selected_source["url"], headers=headers) as resp:
                if resp.status not in [200, 206]:
                    raise HTTPException(status_code=resp.status, detail="Failed to fetch video")
                async for chunk in resp.content.iter_chunked(1024 * 512):  # 512KB chunks
                    yield chunk

    content_length = end - start + 1
    response_headers = {
        "Content-Range": f"bytes {start}-{end}/{total_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": "video/mp4"
    }

    return StreamingResponse(
        stream_chunk(),
        status_code=206 if range_header else 200,
        headers=response_headers
    )

@app.get("/analytics", response_class=JSONResponse)
async def get_analytics(video_id: str = Query(...)):
    data = load_db()
    for entry in data:
        if entry["video_id"] == video_id:
            entry_time = datetime.fromisoformat(entry["timestamp"])
            return {
                "views": entry["views"],
                "created_at": entry["timestamp"],
                "status": "active" if datetime.utcnow() - entry_time < timedelta(minutes=EXPIRY_MINUTES) else "expired",
                "engagement": {
                    "average_watch_time": "85%",
                    "peak_concurrency": 150
                }
            }
    raise HTTPException(status_code=404, detail="Content not found")

# ---------- Scraper ----------
async def fetch_sources(url: str) -> List[Dict[str, str]]:
    sources = []
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
            if response.status == 200:
                soup = BeautifulSoup(await response.text(), 'html.parser')
                for div in soup.find_all('div', class_='mast'):
                    link_tag = div.find('a', rel='nofollow')
                    if link_tag:
                        link = link_tag['href']
                        title = link_tag.text.strip()
                        quality = determine_quality(title)
                        duration = 0
                        try:
                            async with session.head(link, timeout=aiohttp.ClientTimeout(total=5)) as head:
                                if 'X-Content-Duration' in head.headers:
                                    duration = float(head.headers['X-Content-Duration'])
                                elif 'Content-Length' in head.headers:
                                    duration = int(head.headers['Content-Length']) / (128 * 1024 / 8)
                        except Exception as e:
                            print(f"Failed to get duration for {link}: {e}")
                        sources.append({
                            "url": link,
                            "quality": quality,
                            "duration": duration
                        })
    return sources

def determine_quality(title: str) -> str:
    title = title.lower()
    if '1080' in title: return "1080p"
    if '720' in title: return "720p"
    if '480' in title: return "480p"
    if '360' in title: return "360p"
    if 'low' in title: return "Low"
    if 'hd' in title: return "HD"
    return "Unknown"

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

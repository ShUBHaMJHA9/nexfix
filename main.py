from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
from pathlib import Path
import uvicorn
import secrets
import os
import json
import aiohttp
import asyncio
import re
from bs4 import BeautifulSoup
from typing import List, Dict

# Constants
EXPIRY_MINUTES = 60  # video expiration time in minutes
DB_PATH = "/tmp/database.json"

# Initialize FastAPI
app = FastAPI(title="StreamHub Pro", version="2.0", docs_url="/api/docs")
templates = Jinja2Templates(directory="templates")

# Directories
TMP_DIR = Path("/tmp")
STATIC_PATH = TMP_DIR / "static"
SUBTITLE_PATH = STATIC_PATH / "subtitles"
THUMBNAIL_PATH = STATIC_PATH / "thumbnail.jpg"
LOGO_PATH = STATIC_PATH / "logo.svg"
DEFAULT_SUBTITLE = "/static/subtitles/english.vtt"

# Create necessary directories
STATIC_PATH.mkdir(parents=True, exist_ok=True)
SUBTITLE_PATH.mkdir(parents=True, exist_ok=True)

# Dummy files
if not LOGO_PATH.exists():
    LOGO_PATH.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">Logo</text></svg>')

if not THUMBNAIL_PATH.exists():
    THUMBNAIL_PATH.write_bytes(b"\x89PNG\r\n\x1a\n")

DUMMY_SUBTITLE = SUBTITLE_PATH / "english.vtt"
if not DUMMY_SUBTITLE.exists():
    DUMMY_SUBTITLE.write_text("""WEBVTT

00:00:01.000 --> 00:00:03.000
Welcome to NEXFIX MP4HUB. JOIN ..

00:00:04.000 --> 00:00:06.000
Subtitles are working fine!
""")

# Mount static
app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")

# Database operations
def load_db() -> List[Dict]:
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def save_db(data: List[Dict]) -> None:
    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=2)

async def download_file(url: str, dest: Path) -> bool:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    dest.write_bytes(await resp.read())
                    return True
        return False
    except Exception as e:
        print(f"Download failed: {e}")
        return False
# ---------- Main Endpoints ----------

@app.get("/request-movie", response_class=JSONResponse)
async def request_stream(
    url: str = Query(...),
    user_id: str = Query(...),
    thumbnail_url: str = Query(default=None),
    subtitle_url: str = Query(default=None)
):
    video_id = secrets.token_urlsafe(12)
    timestamp = datetime.utcnow().isoformat()
    subtitle_file = DEFAULT_SUBTITLE
    downloaded_sub = None

    # Subtitle Handling
    if subtitle_url:
        sub_path = SUBTITLE_PATH / f"{video_id}.vtt"
        if await download_file(subtitle_url, sub_path):
            subtitle_file = f"/static/subtitles/{video_id}.vtt"
            downloaded_sub = str(sub_path)

    # Thumbnail Handling
    thumbnail_file = "/static/thumbnail.jpg"
    if thumbnail_url:
        thumb_path = STATIC_PATH / f"{video_id}.jpg"
        if await download_file(thumbnail_url, thumb_path):
            thumbnail_file = f"/static/{video_id}.jpg"

    sources = await fetch_sources(url)
    if not sources:
        raise HTTPException(status_code=400, detail="No video sources found")

    video_entry = {
        "video_id": video_id,
        "user_id": user_id,
        "sources": sources,
        "timestamp": timestamp,
        "views": 0,
        "duration": max([s.get("duration", 0) for s in sources], default=0),
        "subtitle": subtitle_file,
        "thumbnail": thumbnail_file,
        "subtitle_file_path": downloaded_sub
    }

    data = load_db()
    data.append(video_entry)
    save_db(data)

    return {
        "video_id": video_id,
        "movie_url": f"/movie?video_id={video_id}",
        "expires_at": (datetime.utcnow() + timedelta(minutes=EXPIRY_MINUTES)).isoformat()
    }

@app.get("/movie", response_class=HTMLResponse)
async def video_movie(request: Request, video_id: str = Query(...)):
    return templates.TemplateResponse("player.html", {"request": request, "video_id": video_id})

@app.get("/stream/{video_id}", response_class=JSONResponse)
async def get_stream(video_id: str):
    data = load_db()
    updated = False
    new_data = []

    for entry in data:
        if entry["video_id"] == video_id:
            entry_time = datetime.fromisoformat(entry["timestamp"])
            if datetime.utcnow() - entry_time > timedelta(minutes=EXPIRY_MINUTES):
                # Cleanup expired content
                if entry.get("subtitle_file_path") and os.path.exists(entry["subtitle_file_path"]):
                    os.remove(entry["subtitle_file_path"])
                thumb_file = STATIC_PATH / f"{video_id}.jpg"
                if thumb_file.exists():
                    os.remove(thumb_file)
                continue

            entry["views"] += 1
            updated = True

            return {
                "sources": [
                    {
                        "url": f"/stream-proxy/{video_id}?quality={s['quality']}",
                        "quality": s["quality"]
                    }
                    for s in entry["sources"]
                ],
                "meta": {
                    "resolution": entry.get("resolution", "Unknown"),
                    "duration": entry["duration"],
                    "views": entry["views"]
                },
                "subtitles": [
                    {
                        "label": "English",
                        "lang": "en",
                        "url": entry["subtitle"],
                        "default": True
                    }
                ],
                "thumbnail": entry["thumbnail"],
                "logo": "/static/logo.svg"
            }
        new_data.append(entry)

    if updated:
        save_db(new_data)

    raise HTTPException(status_code=404, detail="Content not found or expired")

@app.get("/stream-proxy/{video_id}")
async def stream_proxy(video_id: str, request: Request, quality: str = Query(...)):
    data = load_db()
    for entry in data:
        if entry["video_id"] == video_id:
            entry_time = datetime.fromisoformat(entry["timestamp"])
            if datetime.utcnow() - entry_time > timedelta(minutes=EXPIRY_MINUTES):
                raise HTTPException(status_code=403, detail="Stream expired")

            selected_source = next(
                (s for s in entry["sources"] if s["quality"] == quality),
                None
            )
            if not selected_source:
                raise HTTPException(status_code=404, detail="Quality not available")

            range_header = request.headers.get("range", None)
            print("Range header:", range_header)

            async with aiohttp.ClientSession() as session:
                async with session.head(selected_source["url"]) as head_resp:
                    if head_resp.status != 200:
                        raise HTTPException(status_code=head_resp.status, detail="Failed to fetch video header")
                    total_size = int(head_resp.headers.get("Content-Length", 0))
                    print("Total video size:", total_size)

            # Default start and end bytes
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
                        async for chunk in resp.content.iter_chunked(1024 * 512):
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

    raise HTTPException(status_code=404, detail="Invalid video ID")

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
                text = await response.text()
                soup = BeautifulSoup(text, 'html.parser')
                movie_divs = soup.find_all('div', class_='mast')
                for div in movie_divs:
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
                                    # Rough estimate: assume 128kbps average bitrate
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
    import sys
    import logging

    logging.basicConfig(level=logging.INFO)
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        logging.error(f"Failed to start the server: {e}")
        sys.exit(1)

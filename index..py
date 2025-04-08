from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
from typing import List, Dict
import aiohttp, os, re, secrets, json
from pathlib import Path

app = FastAPI()

# In-memory DB fallback (you can replace with DB later)
video_db = {}

# Constants
EXPIRY_MINUTES = 60
TMP = Path("/tmp")
STATIC_DIR = TMP / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Util
async def download_file(url: str, dest: Path) -> bool:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    dest.write_bytes(await resp.read())
                    return True
    except Exception as e:
        print(f"Download failed: {e}")
    return False

@app.get("/request", response_class=JSONResponse)
async def request_video(
    url: str = Query(...),
    user_id: str = Query(...),
    thumb_url: str = Query(default=None)
):
    video_id = secrets.token_urlsafe(10)
    timestamp = datetime.utcnow().isoformat()

    sources = await fetch_sources(url)
    if not sources:
        raise HTTPException(status_code=400, detail="No sources found")

    thumbnail = "/static/thumbnail.jpg"
    if thumb_url:
        thumb_path = STATIC_DIR / f"{video_id}.jpg"
        if await download_file(thumb_url, thumb_path):
            thumbnail = f"/static/{video_id}.jpg"

    video_db[video_id] = {
        "video_id": video_id,
        "user_id": user_id,
        "sources": sources,
        "timestamp": timestamp,
        "views": 0,
        "thumbnail": thumbnail,
    }

    return {
        "video_id": video_id,
        "player_url": f"/watch?video_id={video_id}",
        "stream_url": f"/stream/{video_id}",
        "expires_in": EXPIRY_MINUTES * 60
    }

@app.get("/watch", response_class=HTMLResponse)
async def player_page(video_id: str):
    return f"""
    <html>
    <body style="background:#000;color:white;text-align:center">
        <h2>Stream Video</h2>
        <video width="90%" controls autoplay>
            <source src="/stream-proxy/{video_id}?quality=Low" type="video/mp4">
            Your browser does not support video.
        </video>
    </body>
    </html>
    """

@app.get("/stream/{video_id}")
async def stream_metadata(video_id: str):
    entry = video_db.get(video_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Video not found")

    created = datetime.fromisoformat(entry["timestamp"])
    if datetime.utcnow() - created > timedelta(minutes=EXPIRY_MINUTES):
        del video_db[video_id]
        raise HTTPException(status_code=410, detail="Video expired")

    return {
        "sources": [
            {"url": f"/stream-proxy/{video_id}?quality={s['quality']}", "quality": s["quality"]}
            for s in entry["sources"]
        ],
        "thumbnail": entry["thumbnail"]
    }

@app.get("/stream-proxy/{video_id}")
async def proxy_stream(video_id: str, request: Request, quality: str = Query(...)):
    entry = video_db.get(video_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Invalid video ID")

    src = next((s for s in entry["sources"] if s["quality"] == quality), None)
    if not src:
        raise HTTPException(status_code=404, detail="Quality not found")

    range_header = request.headers.get("range", None)

    async with aiohttp.ClientSession() as session:
        async with session.head(src["url"]) as head:
            if head.status != 200:
                raise HTTPException(status_code=500, detail="Upstream error")

            file_size = int(head.headers.get("Content-Length", 0))

    start, end = 0, file_size - 1
    if range_header:
        match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if match:
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else file_size - 1

    headers = {
        "Range": f"bytes={start}-{end}"
    }

    async def stream_video():
        async with aiohttp.ClientSession() as session:
            async with session.get(src["url"], headers=headers) as resp:
                async for chunk in resp.content.iter_chunked(1024 * 512):
                    yield chunk

    response_headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(end - start + 1),
        "Content-Type": "video/mp4"
    }

    return StreamingResponse(stream_video(), status_code=206 if range_header else 200, headers=response_headers)

# Dummy parser
async def fetch_sources(url: str) -> List[Dict]:
    # Replace with real parser
    return [
        {"quality": "Low", "url": url},
        {"quality": "High", "url": url}
    ]

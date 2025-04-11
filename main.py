from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse, StreamingResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
from pathlib import Path
import uvicorn
import secrets
from fastapi.responses import StreamingResponse, JSONResponse, Response
import os
import json
import aiohttp
import asyncio
import re
from bs4 import BeautifulSoup
from enum import Enum
from typing import List, Dict, Tuple, Optional
import aiohttp
import m3u8
from urllib.parse import urljoin, quote
# Constants
EXPIRY_MINUTES = 60
DB_PATH = "database.json"
TMP_DIR = Path("/tmp")
STATIC_PATH = TMP_DIR / "static"
SUBTITLE_PATH = STATIC_PATH / "subtitles"
THUMBNAIL_PATH = STATIC_PATH / "nexfix-logo.jpg"
LOGO_PATH = STATIC_PATH / "logo.svg"
DEFAULT_SUBTITLE = "/static/subtitles/english.vtt"

class MediaType(str, Enum):
    MOVIE = "movie"
    LIVE = "live"
    ANIME = "anime"
    SERIES = "series"

# Initialize FastAPI
app = FastAPI(title="StreamHub Pro", version="3.0", docs_url="/api/docs")
templates = Jinja2Templates(directory="templates")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize directories and files
def initialize_files_and_dirs():
    STATIC_PATH.mkdir(parents=True, exist_ok=True)
    SUBTITLE_PATH.mkdir(parents=True, exist_ok=True)

    if not LOGO_PATH.exists():
        LOGO_PATH.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">Logo</text></svg>')

    if not THUMBNAIL_PATH.exists():
        THUMBNAIL_PATH.write_bytes(b"\x89PNG\r\n\x1a\n")

    dummy_sub = SUBTITLE_PATH / "english.vtt"
    if not dummy_sub.exists():
        dummy_sub.write_text("""WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nWelcome!\n\n00:00:04.000 --> 00:00:06.000\nSubtitles working!\n""")

initialize_files_and_dirs()
app.mount("/static", StaticFiles(directory="static"), name="static")

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

class MediaHandler:
    @staticmethod
    def determine_media_type(url: str) -> MediaType:
        if url.lower().endswith(".m3u8"):
            return MediaType.LIVE
        return MediaType.MOVIE

    @staticmethod
    def create_stream_url(video_id: str, source: Dict, media_type: MediaType) -> str:
        if media_type == MediaType.LIVE:
            return source["url"]
        return f"/stream-proxy/{video_id}?quality={source['quality']}"

    @staticmethod
    def get_content_type(media_type: MediaType) -> str:
        return "application/x-mpegURL" if media_type == MediaType.LIVE else "video/mp4"

    @classmethod
    async def create_media_entry(
        cls,
        media_type: MediaType,
        sources: List[Dict],
        user_id: str,
        title: str,
        description: str,
        thumbnail_url: Optional[str] = None,
        subtitle_url: Optional[str] = None,
        **kwargs
    ) -> Dict:
        video_id = secrets.token_urlsafe(12)
        
        # Handle subtitle
        subtitle_file = DEFAULT_SUBTITLE
        downloaded_sub = None
        if subtitle_url:
            sub_path = SUBTITLE_PATH / f"{video_id}.vtt"
            if await download_file(subtitle_url, sub_path):
                subtitle_file = f"/static/subtitles/{video_id}.vtt"
                downloaded_sub = str(sub_path)

        # Handle thumbnail
        thumbnail_file = "/static/nexfix-logo.jpg"
        if thumbnail_url:
            thumb_path = STATIC_PATH / f"{video_id}.jpg"
            if await download_file(thumbnail_url, thumb_path):
                thumbnail_file = f"/static/{video_id}.jpg"

        video_entry = {
            "video_id": video_id,
            "user_id": user_id,
            "title": title,
            "description": description,
            "sources": sources,
            "timestamp": datetime.utcnow().isoformat(),
            "views": 0,
            "duration": max([s.get("duration", 0) for s in sources], default=0),
            "subtitle": subtitle_file,
            "thumbnail": thumbnail_file,
            "subtitle_file_path": downloaded_sub,
            "media_type": media_type.value,
            **kwargs
        }

        data = load_db()
        data.append(video_entry)
        save_db(data)

        return {
            "video_id": video_id,
            "url": f"/play?video_id={video_id}",
            "title": title,
            "description": description,
            "expires_at": (datetime.utcnow() + timedelta(minutes=EXPIRY_MINUTES)).isoformat(),
            "media_type": media_type.value
        }

# Verification endpoint
@app.get("/1693bb71edabc1676e00dea6864620a0.html")
async def serve_verification_file():
    return PlainTextResponse("1693bb71edabc1676e00dea6864620a0")

# Unified player endpoint
@app.get("/play", response_class=HTMLResponse)
async def media_player(request: Request, video_id: str = Query(...)):
    return templates.TemplateResponse("player.html", {"request": request, "video_id": video_id})

# Homepage
@app.get("/", response_class=HTMLResponse)
async def homepage():
    return """
    <html>
    <head>
        <meta name="6a97888e-site-verification" content="1693bb71edabc1676e00dea6864620a0">
        <title>Nexfix</title>
    </head>
    <body><h1>Welcome to Nexfix</h1></body>
    </html>
    """
# ——————— Rewrite HLS playlists on the fly ———————
def rewrite_hls_playlist(playlist_text: str, base_uri: str) -> str:
    """
    Given the raw text of an HLS playlist and its base URI,
    rewrite every media URL line to go through our /proxy endpoint.
    """
    out = []
    for line in playlist_text.splitlines():
        if line.strip().startswith("#"):
            out.append(line)
        elif line.strip():
            # this is a URI to segment, variant, or subtitle
            uri = line.strip()
            full = uri if uri.startswith("http") else urljoin(base_uri, uri)
            proxied = f"/proxy?url={quote(full, safe='')}"
            out.append(proxied)
        else:
            out.append(line)
    return "\n".join(out)


# ——————— Proxy endpoint ———————
@app.get("/proxy")
async def proxy(request: Request, url: str):
    """
    Streams any URL (playlist, segment, subtitle) through our server with CORS headers.
    If it's a .m3u8, rewrites the playlist so all URIs are proxied too.
    """
    headers = {"Access-Control-Allow-Origin": "*"}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=resp.status, detail="Upstream error")

                content_type = resp.headers.get("Content-Type", "")
                # If it's an HLS playlist, rewrite it
                if "application/vnd.apple.mpegurl" in content_type or url.lower().endswith(".m3u8"):
                    text = await resp.text()
                    rewritten = rewrite_hls_playlist(text, url)
                    return Response(content=rewritten, media_type=content_type, headers=headers)

                # Otherwise stream it raw (TS segment, subtitle, etc.)
                return StreamingResponse(
                    resp.content.iter_chunked(1024*32),
                    media_type=content_type or "application/octet-stream",
                    headers=headers
                )
    except aiohttp.ClientError as e:
        raise HTTPException(status_code=502, detail=f"Upstream connection error: {e}")


# ——————— Parse master playlist to JSON ———————
async def parse_m3u8_to_json(url: str) -> dict:
    print(" I am Here in m4u8 json")
    """
    Fetches and parses a master .m3u8 playlist and returns JSON with proxied sources and subtitles.
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=resp.status, detail="Failed to fetch master playlist")
            playlist_content = await resp.text()

    master_playlist = m3u8.loads(playlist_content, uri=url)

    # Extract video sources
    sources = []
    for playlist in master_playlist.playlists or []:
        resolution = getattr(playlist.stream_info, "resolution", None)
        quality = f"{resolution[1]}p" if resolution else "auto"
        stream_url = playlist.absolute_uri or urljoin(url, playlist.uri)

        sources.append({
            "url": f"/proxy?url={quote(stream_url, safe='')}",
            "quality": quality,
            "type": "application/x-mpegURL"
        })

    # Extract subtitles
    subtitles = []
    for media in master_playlist.media or []:
        if media.type == "SUBTITLES" and media.uri:
            subtitle_url = media.uri if media.uri.startswith("http") else urljoin(url, media.uri)
            subtitles.append({
                "label": media.name or "Unknown",
                "lang": media.language or "en",
                "url": f"/proxy?url={quote(subtitle_url, safe='')}",
                "default": bool(media.default)
            })

    # Fallback for single stream (no playlist variants)
    if not sources:
        sources = [{
            "url": f"/proxy?url={quote(url, safe='')}",
            "quality": "auto",
            "type": "application/x-mpegURL"
        }]

    return {
        "sources": sources,
        "subtitles": subtitles
    }

# -------------- 🎬 API Endpoint -------------------
@app.get("/stream/{video_id}", response_class=JSONResponse)
async def get_stream_info(video_id: str):
    data = load_db()

    for entry in data:
        if entry["video_id"] != video_id:
            continue

        try:
            entry_time = datetime.fromisoformat(entry["timestamp"])
        except Exception:
            continue

        if datetime.utcnow() - entry_time > timedelta(minutes=EXPIRY_MINUTES):
            if entry.get("subtitle_file_path") and Path(entry["subtitle_file_path"]).exists():
                Path(entry["subtitle_file_path"]).unlink()
            thumb_file = STATIC_PATH / f"{video_id}.jpg"
            if thumb_file.exists():
                thumb_file.unlink()
            continue

        # Update views
        entry["views"] += 1
        save_db(data)

        media_type = entry.get("media_type", MediaType.MOVIE)
        print(media_type)

        # 🔴 LIVE STREAM CASE
        if media_type == MediaType.LIVE:
            hls_url = (entry.get("sources") or [{}])[0].get("url", "")
            parsed = await parse_m3u8_to_json(hls_url)

            return {
                "sources": parsed["sources"],
                "meta": {
                    "title": entry.get("title", "Unknown Title"),
                    "description": entry.get("description", ""),
                    "duration": entry.get("duration", 0),
                    "views": entry["views"],
                    "media_type": media_type,
                    "is_live": True
                },
                "subtitles": parsed["subtitles"],
                "thumbnail": entry.get("thumbnail", "/static/nexfix-logo.jpg")
            }

        # 🎥 VOD CASE
        return {
            "sources": [
                {
                    "url": MediaHandler.create_stream_url(video_id, s, media_type),
                    "quality": s["quality"],
                    "type": MediaHandler.get_content_type(media_type)
                } for s in entry.get("sources", [])
            ],
            "meta": {
                "title": entry.get("title", "Unknown Title"),
                "description": entry.get("description", ""),
                "duration": entry.get("duration", 0),
                "views": entry["views"],
                "media_type": media_type,
                "is_live": False
            },
            "subtitles": [
                {
                    "label": "English",
                    "lang": "en",
                    "url": f"/proxy?url={quote(entry['subtitle'])}",
                    "default": True
                }
            ] if entry.get("subtitle") else [],
            "thumbnail": entry.get("thumbnail", "/static/nexfix-logo.jpg")
        }

    raise HTTPException(status_code=404, detail="Content not found or expired")

    raise HTTPException(status_code=404, detail="Not found")
# Proxy endpoint for non-HLS content
@app.get("/stream-proxy/{video_id}")
async def stream_proxy(video_id: str, request: Request, quality: str = Query(...)):
    data = load_db()
    for entry in data:
        if entry["video_id"] == video_id:
            if datetime.utcnow() - datetime.fromisoformat(entry["timestamp"]) > timedelta(minutes=EXPIRY_MINUTES):
                raise HTTPException(status_code=403, detail="Stream expired")

            source = next((s for s in entry["sources"] if s["quality"] == quality), None)
            if not source:
                raise HTTPException(status_code=404, detail="Quality not available")

            range_header = request.headers.get("range")
            async with aiohttp.ClientSession() as session:
                async with session.head(source["url"]) as head_resp:
                    if head_resp.status != 200:
                        raise HTTPException(status_code=head_resp.status, detail="Failed to fetch video header")
                    total_size = int(head_resp.headers.get("Content-Length", 0))

            start, end = 0, total_size - 1
            if range_header:
                range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
                if range_match:
                    start = int(range_match.group(1))
                    if range_match.group(2):
                        end = int(range_match.group(2))
                    if start > end:
                        raise HTTPException(status_code=416, detail="Invalid range")

            async def stream_chunk():
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        source["url"], 
                        headers={"Range": f"bytes={start}-{end}"}
                    ) as resp:
                        async for chunk in resp.content.iter_chunked(1024 * 512):
                            yield chunk

            return StreamingResponse(
                stream_chunk(),
                status_code=206 if range_header else 200,
                headers={
                    "Content-Range": f"bytes {start}-{end}/{total_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(end - start + 1),
                    "Content-Type": "video/mp4"
                }
            )

    raise HTTPException(status_code=404, detail="Invalid video ID")

# Media request endpoints
@app.get("/request-movie", response_class=JSONResponse)
async def request_movie(
    url: str = Query(...),
    user_id: str = Query(...),
    thumbnail_url: str = Query(default=None),
    subtitle_url: str = Query(default=None)
):
    sources, title, description = await fetch_sources(url)
    if not sources:
        raise HTTPException(status_code=400, detail="No video sources found")

    return await MediaHandler.create_media_entry(
        media_type=MediaType.MOVIE,
        sources=sources,
        user_id=user_id,
        title=title,
        description=description,
        thumbnail_url=thumbnail_url,
        subtitle_url=subtitle_url
    )

@app.get("/request-live", response_class=JSONResponse)
async def request_live_stream(
    url: str = Query(..., description="Must be a valid .m3u8 URL"),
    user_id: str = Query(...),
    title: str = Query(default="Live Stream"),
    description: str = Query(default="Live event"),
    thumbnail_url: str = Query(default=None),
):
    if not url.lower().endswith(".m3u8"):
        raise HTTPException(status_code=400, detail="Only .m3u8 URLs are supported")

    return await MediaHandler.create_media_entry(
        media_type=MediaType.LIVE,
        sources=[{"url": url, "quality": "auto"}],
        user_id=user_id,
        title=title,
        description=description,
        thumbnail_url=thumbnail_url
    )

@app.get("/request-anime", response_class=JSONResponse)
async def request_anime(
    url: str = Query(...),
    user_id: str = Query(...),
    thumbnail_url: str = Query(default=None),
    subtitle_url: str = Query(default=None),
    episode: int = Query(default=1),
    season: int = Query(default=1)
):
    sources, title, description = await fetch_sources(url)
    if not sources:
        raise HTTPException(status_code=400, detail="No video sources found")

    return await MediaHandler.create_media_entry(
        media_type=MediaType.ANIME,
        sources=sources,
        user_id=user_id,
        title=f"{title} - S{season}E{episode}",
        description=description,
        thumbnail_url=thumbnail_url,
        subtitle_url=subtitle_url,
        episode=episode,
        season=season
    )

# Analytics endpoint
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
                "engagement": {"average_watch_time": "85%", "peak_concurrency": 150}
            }
    raise HTTPException(status_code=404, detail="Content not found")

# Helper functions
async def fetch_sources(url: str) -> Tuple[List[Dict[str, str]], Optional[str], Optional[str]]:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                soup = BeautifulSoup(await response.text(), 'html.parser')
                title = soup.find('h2').text.strip() if soup.find('h2') else None
                description = soup.find('div', class_='description').text.strip() if soup.find('div', class_='description') else None
                
                sources = []
                for div in soup.find_all('div', class_='mast'):
                    if link := div.find('a', rel='nofollow'):
                        sources.append({
                            "url": link['href'],
                            "quality": determine_quality(link.text.strip()),
                            "duration": 0
                        })
                return sources, title, description
    return [], None, None

def determine_quality(title: str) -> str:
    title = title.lower()
    if '720' in title: return "720p"
    if '480' in title: return "480p"
    if '360' in title: return "360p"
    if 'low' in title: return "Low"
    if 'hd' in title: return "HD"
    return "Unknown"

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
from fastapi import FastAPI, Request, Query, HTTPException, Depends
from fastapi.responses import JSONResponse, HTMLResponse, StreamingResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
import uvicorn
from api.sql import create_connection
from m3u8 import ParseError
import httpx
from typing import List, Dict, Optional, Tuple
from enum import Enum
from fastapi.responses import StreamingResponse, Response
import tempfile
import re
import uuid
from starlette.status import HTTP_206_PARTIAL_CONTENT, HTTP_200_OK
from pydantic import BaseModel
from bs4 import BeautifulSoup
import secrets
from urllib.parse import unquote, urljoin
from typing import Optional, List, Dict, Any
import os
import json
import aiohttp
from aiohttp import ClientSession, ClientTimeout, TCPConnector
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import m3u8
from urllib.parse import urljoin, quote, urlparse
import urllib
from cachetools import TTLCache
import ipaddress
import logging
from api.home import home_app
# Constants
EXPIRY_MINUTES = 60
DB_PATH = "database.json"
STATIC_PATH = Path("static")
SUBTITLE_PATH = STATIC_PATH / "subtitles"
THUMBNAIL_PATH = STATIC_PATH / "nexfix-logo.jpg"
LOGO_PATH = STATIC_PATH / "logo.svg"
DEFAULT_SUBTITLE = "/static/subtitles/english.vtt"
NODE = "node_modules"
DEFAULT_SUBTITLE = "/static/subtitles/english.vtt"

http_client = httpx.AsyncClient()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

rate_limit_cache = TTLCache(maxsize=1000, ttl=60)
RATE_LIMIT_REQUESTS = 100
templates = Jinja2Templates(directory="templates")
home = Jinja2Templates(directory="home")
class MediaType(str, Enum):
    MOVIE = "movie"
    LIVE = "live"
    ANIME = "anime"
    SERIES = "series"
    EMBED = "iframe"

app = FastAPI(title="StreamHub Pro", version="3.0", docs_url="/api/docs")

@app.on_event("startup")
async def startup_event():
    global session
    connector = TCPConnector(limit=100, ssl=False)
    session = ClientSession(connector=connector)

@app.on_event("shutdown")
async def shutdown_event():
    global session
    if session:
        await session.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")
app.mount("/node_modules", StaticFiles(directory=NODE), name="node")
# Use '/assets' instead of '/static'
app.mount("/assets", StaticFiles(directory="home"), name="assets")
print("Successfully imported home_app:", home_app)
app.mount("/home", home_app)

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
            async with session.get(url, timeout=ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    dest.write_bytes(await resp.read())
                    return True
        return False
    except Exception as e:
        logger.error(f"Download failed: {e}")
        return False

class MediaSource(BaseModel):
    url: str
    quality: str
    type: Optional[str] = "application/x-mpegURL"

class AudioOption(BaseModel):
    name: str
    language: str
    url: Optional[str]

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
        subtitle_file = DEFAULT_SUBTITLE
        downloaded_sub = None
        if subtitle_url:
            sub_path = SUBTITLE_PATH / f"{video_id}.vtt"
            if await download_file(subtitle_url, sub_path):
                subtitle_file = f"/static/subtitles/{video_id}.vtt"
                downloaded_sub = str(sub_path)

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

async def validate_url(url: str) -> bool:
    if not url.startswith(("http://", "https://")):
        return False
    try:
        ip = ipaddress.ip_address(urlparse(url).hostname)
        if ip.is_private:
            return False
    except ValueError:
        pass
    return True

async def rate_limit_check(request: Request):
    client_ip = request.client.host
    current_time = int(datetime.utcnow().timestamp() // 60)
    cache_key = f"{client_ip}:{current_time}"

    request_count = rate_limit_cache.get(cache_key, 0)
    if request_count >= RATE_LIMIT_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    rate_limit_cache[cache_key] = request_count + 1

async def stream_file(url: str, request: Request):
    range_header = request.headers.get("range")
    async with aiohttp.ClientSession() as session:
        async with session.head(url) as head_resp:
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
            headers = {"Range": f"bytes={start}-{end}"}
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as resp:
                    async for chunk in resp.content.iter_chunked(1024 * 1024 * 2):
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

@app.get("/embed", response_class=HTMLResponse)
async def get_embed_page(request: Request, url: str):
    try:
        decoded_url = unquote(url)
        if not decoded_url:
            raise HTTPException(status_code=400, detail="URL parameter is empty")
        if not decoded_url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="Invalid URL protocol; must be http or https")
        parsed_url = urlparse(decoded_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            raise HTTPException(status_code=400, detail="Invalid URL structure; must include scheme and domain")
        template_path = Path("templates/embed.html")
        if not template_path.exists():
            logger.error(f"Template not found at {template_path}")
            raise HTTPException(status_code=500, detail="Template 'embed.html' not found")
        return templates.TemplateResponse("embed.html", {
            "request": request,
            "video_url": decoded_url,
            "video_id": str(uuid.uuid4())[:8]
        })
    except ValueError as ve:
        logger.error(f"Invalid URL format: {str(ve)}")
        raise HTTPException(status_code=400, detail=f"Invalid URL format: {str(ve)}")
    except Exception as e:
        logger.error(f"Embed error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process embed request: {str(e)}")


@app.get("/proxy")
async def proxy_stream(url: str, request: Request):
    try:
        decoded_url = unquote(url)
        if decoded_url.startswith("/proxy?url="):
            decoded_url = unquote(decoded_url.split("?url=", 1)[1])
        if not decoded_url.startswith(("http://", "https://")):
            decoded_url = urljoin("https://", decoded_url)

        logger.info(f"Proxying URL: {decoded_url}")

        if decoded_url.endswith(('.m3u8', '.m3u')):
            return await handle_hls_playlist(decoded_url, request)
        elif any(ext in decoded_url for ext in ['init.mp4', 'init.fmp4', 'init.hls.fmp4']):
            return Response(status_code=307, headers={"Location": decoded_url})
        elif decoded_url.endswith(('.ts', '.m4s', '.mp4')):
            return await proxy_media_segment(decoded_url)
        elif decoded_url.endswith('.key'):
            return await proxy_encryption_key(decoded_url)
        else:
            return await stream_file(decoded_url, request)
            
    except Exception as e:
        logger.error(f"Proxy error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")
async def handle_hls_playlist(playlist_url: str, request: Request):
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        try:
            resp = await client.get(playlist_url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            content = resp.text
            base_url = playlist_url.rsplit("/", 1)[0] + "/"
            proxy_url = "https://potential-potato-69v64xw9j5wpcgrw-8000.app.github.dev/proxy"

            processed_lines = []
            for line in content.splitlines():
                if not line.strip() or line.startswith("#"):
                    if line.startswith("#EXT-X-KEY:"):
                        uri_match = re.search(r'URI="([^"]+)"', line)
                        if uri_match:
                            key_uri = uri_match.group(1)
                            if not key_uri.startswith(("http://", "https://")):
                                key_uri = urljoin(base_url, key_uri)
                            line = line.replace(
                                f'URI="{uri_match.group(1)}"',
                                f'URI="{proxy_url}?url={quote(key_uri)}"'
                            )
                    elif line.startswith("#EXT-X-MEDIA:") and "URI=" in line:
                        uri_match = re.search(r'URI="([^"]+)"', line)
                        if uri_match:
                            media_uri = uri_match.group(1)
                            if not media_uri.startswith(("http://", "https://")):
                                media_uri = urljoin(base_url, media_uri)
                            line = line.replace(
                                f'URI="{uri_match.group(1)}"',
                                f'URI="{proxy_url}?url={quote(media_uri)}"'
                            )
                    elif line.startswith("#EXT-X-MAP:"):
                        uri_match = re.search(r'URI="([^"]+)"', line)
                        if uri_match:
                            map_uri = uri_match.group(1)
                            if not map_uri.startswith(("http://", "https://")):
                                map_uri = urljoin(base_url, map_uri)
                            line = line.replace(
                                f'URI="{uri_match.group(1)}"',
                                f'URI="{proxy_url}?url={quote(map_uri)}"'
                            )
                    processed_lines.append(line)
                    continue

                full_url = urljoin(base_url, line) if not line.startswith(("http://", "https://")) else line
                processed_lines.append(f"{proxy_url}?url={quote(full_url)}")

            return Response(
                content="\n".join(processed_lines),
                media_type="application/vnd.apple.mpegurl",
                headers={
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "*"
                }
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"HLS HTTP error: {e.response.status_code} - {e}")
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            logger.error(f"HLS processing error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"HLS processing error: {str(e)}")

async def proxy_media_segment(segment_url: str):
    async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
        try:
            resp = await client.get(segment_url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            
            content_type = {
                '.ts': "video/MP2T",
                '.m4s': "video/mp4",
                '.mp4': "video/mp4"
            }.get(segment_url[segment_url.rfind('.'):], "video/mp4")

            return Response(
                content=resp.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "*"
                }
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Segment HTTP error: {e.response.status_code} - {e}")
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            logger.error(f"Segment proxy error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Segment proxy error: {str(e)}")

async def proxy_encryption_key(key_url: str):
    async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
        try:
            resp = await client.get(key_url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            
            return Response(
                content=resp.content,
                media_type="application/octet-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "*"
                }
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Key HTTP error: {e.response.status_code} - {e}")
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            logger.error(f"Key proxy error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Key proxy error: {str(e)}")

@app.get("/stream/{video_id}", response_class=JSONResponse)
async def get_stream_info(video_id: str, _: None = Depends(rate_limit_check)):
    data = load_db()
    entry = next((e for e in data if e["video_id"] == video_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Content not found")

    if datetime.utcnow() - datetime.fromisoformat(entry["timestamp"]) > timedelta(minutes=EXPIRY_MINUTES):
        raise HTTPException(status_code=403, detail="Stream expired")

    media_type = MediaType(entry.get("media_type", MediaType.MOVIE.value))

    response = {
        "sources": [
            {
                "url": f"{quote(s['url'], safe='')}",
                "quality": s["quality"],
                "type": s["type"],
                "codecs": s.get("codecs", "avc1")
            } for s in entry.get("sources", []) if s.get('url') and s['url'].startswith(('http://', 'https://'))
        ],
        "meta": {
            "title": entry.get("title", "Unknown"),
            "description": entry.get("description", ""),
            "duration": entry.get("duration", 0),
            "views": entry.get("views", 0),
            "media_type": media_type.value
        },
        "subtitles": [{"url": entry["subtitle"], "language": "en", "name": "English"}] if entry.get("subtitle") else [],
        "thumbnail": entry.get("thumbnail", "/static/nexfix-logo.jpg")
    }

    entry["views"] = entry.get("views", 0) + 1
    save_db(data)
    return response

async def handle_m3u8_playlist(url: str, request: Request):
    session = request.app.state.http_client
    try:
        clean_url = unquote(url)
        async with session.get(clean_url) as resp:
            resp.raise_for_status()
            content = await resp.text()
        
        base_url = clean_url.rsplit("/", 1)[0] + "/"
        proxy_base = str(request.url_for("proxy_stream"))
        
        processed_lines = []
        for line in content.splitlines():
            if line.strip() == "":
                processed_lines.append(line)
                continue
                
            if line.startswith("#"):
                if line.startswith("#EXT-X-MEDIA:") and "URI=" in line:
                    uri_match = re.search(r'URI="([^"]+)"', line)
                    if uri_match:
                        original_uri = uri_match.group(1)
                        if not original_uri.startswith(("http://", "https://")):
                            full_uri = urljoin(base_url, original_uri)
                            line = line.replace(f'URI="{original_uri}"', f'URI="{proxy_base}?url={quote(full_uri)}"')
                processed_lines.append(line)
                continue
                
            full_url = urljoin(base_url, line) if not line.startswith(("http://", "https://")) else line
            if any(ext in full_url for ext in ['.init.mp4', '.init.fmp4', 'init.hls.fmp4']):
                processed_lines.append(full_url)
            else:
                processed_lines.append(f"{proxy_base}?url={quote(full_url)}")

        return Response(
            content="\n".join(processed_lines),
            media_type="application/vnd.apple.mpegurl",
            headers={
                "Cache-Control": "no-cache",
                "Access-Control-Allow-Origin": "*",
                "Content-Disposition": "inline"
            }
        )

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing HLS playlist: {str(e)}")

@app.get("/play", response_class=HTMLResponse)
async def media_player(request: Request, video_id: str = Query(...)):
    template_path = Path("templates/player.html")
    print(template_path)
    if not template_path.exists():
        logger.error(f"Template not found at {template_path}")
        raise HTTPException(status_code=500, detail="Template 'player.html' not found")
    return templates.TemplateResponse("player.html", {"request": request, "video_id": video_id})



@app.get("/", response_class=HTMLResponse)
async def homepage(request: Request):
    home_path = Path("home/home.html")
    if not home_path.exists():
        logger.error(f"Home not found at {home_path}")
        raise HTTPException(status_code=500, detail="Home 'home.html' not found")
    return home.TemplateResponse("home.html", {"request": request})

@app.get("/request-movie", response_class=JSONResponse)
async def request_movie(
    url: str = Query(...),
    user_id: str = Query(...),
    thumbnail_url: str = Query(default=None),
    subtitle_url: str = Query(default=None),
    _: None = Depends(rate_limit_check)
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
async def fetch_m3u8_details(url: str) -> tuple[List[dict], List[dict], List[dict]]:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }

    try:
        timeout = aiohttp.ClientTimeout(total=10)
        async with aiohttp.ClientSession(headers=headers, timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    error_detail = await resp.text()
                    raise HTTPException(
                        status_code=resp.status,
                        detail=f"Failed to fetch M3U8 playlist: {error_detail}"
                    )

                content = await resp.text()

        m3u8_obj = m3u8.loads(content)
        sources = []
        subtitle_urls = []
        audio_options = []

        if m3u8_obj.is_variant:
            for playlist in m3u8_obj.playlists:
                stream_info = playlist.stream_info
                resolution = stream_info.resolution if stream_info else None
                quality = f"{resolution[1]}p" if resolution else "Auto"
                absolute_url = urljoin(url, playlist.uri)
                sources.append({
                    "url": absolute_url,
                    "quality": quality,
                    "type": "application/x-mpegURL"
                })
        else:
            sources.append({
                "url": url,
                "quality": "Auto",
                "type": "application/x-mpegURL"
            })

        for media in m3u8_obj.media:
            if media.type == "SUBTITLES" and media.uri:
                subtitle_url = urljoin(url, media.uri)
                subtitle_urls.append({
                    "url": subtitle_url,
                    "name": media.name or "Subtitles",
                    "language": media.language or "und",
                    "default": media.default or False
                })
            elif media.type == "AUDIO" and media.uri:
                audio_url = urljoin(url, media.uri)
                # Differentiate audio tracks by bitrate
                bitrate = "Unknown"
                if "b256000" in audio_url:
                    bitrate = "High"
                elif "b128000" in audio_url:
                    bitrate = "Low"
                elif "b56000" in audio_url:
                    bitrate = "Medium"
                audio_options.append({
                    "url": audio_url,
                    "name": f"{media.name or 'Audio'} ({bitrate})",
                    "language": media.language or "und",
                    "default": media.default or False,
                    "type": "application/x-mpegURL"
                })

        # Deduplicate subtitles and audio options
        subtitle_urls = list({f"{s['url']}-{s['language']}": s for s in subtitle_urls}.values())
        audio_options = list({f"{a['url']}-{a['language']}": a for a in audio_options}.values())

        # Validate parsed data
        if not sources:
            logger.warning("No video sources found in M3U8 playlist")
        if not audio_options:
            logger.warning("No audio tracks found in M3U8 playlist")
        if not subtitle_urls:
            logger.warning("No subtitles found in M3U8 playlist")

        logger.info(f"Sources: {sources}, Subtitles: {subtitle_urls}, Audio options: {audio_options}")
        return sources, subtitle_urls, audio_options

    except ParseError as e:
        raise HTTPException(status_code=400, detail=f"Invalid M3U8 content: {str(e)}")
    except aiohttp.ClientError as e:
        raise HTTPException(status_code=503, detail=f"Network error occurred: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    
@app.get("/request-embed", response_model=Dict[str, Any])
async def request_embedded_stream(
    iframe_url: str = Query(..., description="URL of the iframe to embed"),
    user_id: str = Query(..., min_length=1),
    title: str = Query("Embedded Stream"),
    description: str = Query("Embedded content"),
    thumbnail_url: Optional[str] = Query(None),
    is_live: bool = Query(False, description="Whether the embedded stream is live"),
    _: None = Depends(rate_limit_check)
):
    try:
        decoded_url = unquote(iframe_url)
        sources = [{
            "url": decoded_url,
            "quality": "Embedded",
            "type": "iframe",
        }]

        return await MediaHandler.create_media_entry(
            media_type=MediaType.EMBED,
            sources=sources,
            user_id=user_id,
            title=title,
            description=description,
            thumbnail_url=thumbnail_url,
            subtitle_url=None,
            audio_options=[],
            is_live=is_live
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process embedded request: {str(e)}")
@app.get("/request-live", response_model=Dict[str, Any])
async def request_live_stream(
    url: str = Query(..., description="URL-encoded .m3u8 URL"),
    user_id: str = Query(..., min_length=1),
    title: str = Query("Live Stream"),
    description: str = Query("Live event"),
    thumbnail_url: Optional[str] = Query(None),
    is_live: bool = Query(True, description="Whether the stream is live"),
    _: None = Depends(rate_limit_check)
):
    try:
        decoded_url = unquote(url)
        sources, subtitles, audio_options = await fetch_m3u8_details(decoded_url)
        sources.append({
            "url": decoded_url,
            "quality": "Auto",
            "type": "application/x-mpegURL"
        })
        return await MediaHandler.create_media_entry(
            media_type=MediaType.LIVE,
            sources=sources,
            user_id=user_id,
            title=title,
            description=description,
            thumbnail_url=thumbnail_url,
            subtitles=subtitles,
            audio_options=audio_options,
            is_live=is_live
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process request: {str(e)}")

@app.get("/request-anime", response_class=JSONResponse)
async def request_anime(
    url: str = Query(...),
    user_id: str = Query(...),
    thumbnail_url: str = Query(default=None),
    subtitle_url: str = Query(default=None),
    episode: int = Query(default=1),
    season: int = Query(default=1),
    _: None = Depends(rate_limit_check)
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

@app.get("/analytics", response_class=JSONResponse)
async def get_analytics(video_id: str = Query(...), _: None = Depends(rate_limit_check)):
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
                            "url": urljoin(url, link['href']),
                            "quality": determine_quality(link.text.strip()),
                            "type": "application/x-mpegURL" if link['href'].endswith('.m3u8') else "video/mp4",
                            "codecs": "avc1",
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

import traceback

##movie handler i here so dont touch that code 

@app.get("/watch", response_class=HTMLResponse)
async def media_player(request: Request, v: str = Query(...)):  # v is now the video ID
    # Ensure the template exists
    template_path = Path("home/watch.html")
    if not template_path.exists():
        logger.error(f"Template not found at {template_path}")
        raise HTTPException(status_code=500, detail="Template 'watch.html' not found")
    return home.TemplateResponse("watch.html", {"request": request, "video_id": v})

@app.get("/download/{video_id}/{quality}")
async def download_video(video_id: str, quality: str, request: Request):
    conn = create_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT url FROM download WHERE movie_id = %s AND quality = %s", (video_id, quality))
            result = cur.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Download URL not found")
            actual_url = result[0]

        range_header = request.headers.get("range")

        session = aiohttp.ClientSession()
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            async with session.head(actual_url, headers=headers) as head_resp:
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
                async with session.get(actual_url, headers=headers) as resp:
                    async for chunk in resp.content.iter_chunked(1024 * 1024 * 2):  # 2MB
                        yield chunk
                await session.close()

            return StreamingResponse(
                stream_chunk(),
                status_code=206 if range_header else 200,
                headers={
                    "Content-Range": f"bytes {start}-{end}/{total_size}" if range_header else "",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(end - start + 1),
                    "Content-Type": content_type,
                    "Content-Disposition": f'attachment; filename="{video_id}.mp4"'
                }
            )
        except Exception:
            await session.close()
            raise

    except Exception as e:
        print("Download Error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again later.")
    finally:
        conn.close()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import StreamingResponse
import aiohttp
import asyncio
import logging

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Simulate a video_id to URL map (use DB or cache in real app)
VIDEO_URL_MAP = {
    "1yQJqs11LYirS56Q": "https://dl3.fastxmp4.com/download/46057/River-of-Blood-(2024)-Hindi-Dubbed-Movie--240p-[Orgmovies].mp4?st=Gjj5Px78SXAX50a4JzCZCQ&e=1744093892"
}

CHUNK_SIZE = 1024 * 512  # 512KB


async def fetch_stream(url: str):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=resp.status, detail="Unable to fetch video.")
                
                logger.info(f"Streaming from {url}")
                async for chunk in resp.content.iter_chunked(CHUNK_SIZE):
                    yield chunk
    except aiohttp.ClientConnectionError:
        logger.error("Connection error during streaming.")
        raise HTTPException(status_code=502, detail="Streaming connection failed.")
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@app.get("/stream-proxy/{video_id}")
async def stream_proxy(video_id: str, request: Request):
    url = VIDEO_URL_MAP.get(video_id)

    if not url:
        raise HTTPException(status_code=404, detail="Video not found.")

    # Optional: Check Range header for partial streaming (advanced)
    headers = {
        "Accept-Ranges": "bytes"
    }

    return StreamingResponse(
        fetch_stream(url),
        media_type="video/mp4",
        status_code=206,
        headers=headers
    )

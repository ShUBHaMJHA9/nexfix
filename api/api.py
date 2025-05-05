from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

# Create FastAPI instance
api = FastAPI(title="All Api", version="3.0", docs_url=None)

@api.get("/login")
async def serve_login():
    file_path = os.path.join("home", "login.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Page not found")

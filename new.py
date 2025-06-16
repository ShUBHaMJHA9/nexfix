import socketio
import asyncio

sio = socketio.AsyncClient()

@sio.event
async def connect():
    print("✅ Connected!")

@sio.event
async def connect_error(data):
    print("❌ Connection failed:", data)

@sio.event
async def disconnect():
    print("❌ Disconnected!")

async def main():
    try:
        await sio.connect('http://localhost:8000', socketio_path='/ws/socket.io')
        await sio.wait()
    except Exception as e:
        print("❌ Error:", e)

asyncio.run(main())

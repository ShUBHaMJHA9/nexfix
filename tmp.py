from flask import Flask, Response, request, jsonify
import requests
from m3u8 import M3U8
from urllib.parse import urljoin

app = Flask(__name__)

# Master playlist URL
M3U8_URL = 'https://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8'

@app.route('/stream-live', methods=['GET'])
def stream_live():
    quality = request.args.get('quality', '1080p')  # Default to 1080p
    audio = request.args.get('audio', None)
    subtitle = request.args.get('subtitle', None)
    
    # Fetch and parse master playlist
    m3u8_response = requests.get(M3U8_URL)
    m3u8_obj = M3U8(m3u8_response.text)
    
    # Extract available qualities with proper URLs
    qualities = []
    for playlist in m3u8_obj.playlists:
        stream_info = playlist.stream_info
        resolution = stream_info.resolution
        if resolution:
            quality_label = f"{resolution[1]}p"
        else:
            quality_label = "unknown"
        # Generate absolute URL for the variant playlist
        playlist_url = urljoin(M3U8_URL, playlist.uri)
        qualities.append({'quality': quality_label, 'url': playlist_url})
    
    # Find the requested quality
    selected_quality = next((q for q in qualities if q['quality'] == quality), None)
    if not selected_quality:
        return jsonify({"error": "Quality not found!"}), 404
    
    # Optional: Add logic for audio and subtitles
    return jsonify({
        "requested_quality": quality,
        "quality_url": selected_quality['url'],
        "available_qualities": [q['quality'] for q in qualities],
        "audio_options": [],
        "subtitle_options": []
    })

@app.route('/<path:filename>')
def stream(filename):
    try:
        # Construct URL relative to the master playlist's location
        file_url = urljoin(M3U8_URL, filename)
        resp = requests.get(file_url, stream=True)
        return Response(
            resp.iter_content(chunk_size=1024),
            content_type=resp.headers.get('Content-Type', 'application/octet-stream')
        )
    except Exception as e:
        return f"Error: {e}", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
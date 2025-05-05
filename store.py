import os
import re
import time
import logging
import subprocess
import psycopg2
import hashlib
import base64
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Optional

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Generate 8-character unique ID

def generate_unique_id(name: str, release_year: str) -> str:
    """Generate an 8-character unique ID from name and release year."""
    combined = f"{name}{release_year}".encode()
    hash_object = hashlib.md5(combined)
    return base64.urlsafe_b64encode(hash_object.digest())[:8].decode()

def create_connection():
    try:
        tembo_uri = os.getenv("DATABASE_URL")
        
        # Ensure TEMBO_URI is provided
        if not tembo_uri:
            raise ValueError("TEMBO_URI environment variable is not set.")
        
        # Connect through the proxy (Ensure your proxy server is set up correctly)
        conn = psycopg2.connect(tembo_uri)
        
        logger.info("✅ Connected to the database through proxy")
        return conn
    
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return None
# Create movies table if not exists
def create_movies_table(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS movies (
                    id SERIAL PRIMARY KEY,
                    unique_id VARCHAR(8) UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT,
                    genre TEXT,
                    release_date TEXT,
                    release_year TEXT,
                    starring TEXT,
                    director TEXT,
                    rating TEXT,
                    poster_path TEXT,
                    download_links TEXT,
                    movie_link TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(name, release_year)
                )
            """)
            conn.commit()
            logger.info("✅ Movies table ensured")
    except Exception as e:
        logger.error(f"❌ Error creating table: {e}")

# Insert movie data into the database
def insert_movie_data(conn, data: Dict) -> bool:
    # Skip if name is missing or invalid
    if data['name'] == 'N/A' or not data['name']:
        logger.warning(f"Skipping insertion due to missing name: {data}")
        return False

    # Generate unique ID
    unique_id = generate_unique_id(data['name'], data['release_year'])

    try:
        with conn.cursor() as cur:
            # Prepare values, convert 'N/A' or empty to None
            values = [
                unique_id,
                data['name'],
                data['description'] if data['description'] and data['description'] != 'N/A' else None,
                data['category'] if data['category'] and data['category'] != 'N/A' else None,
                data['genre'] if data['genre'] and data['genre'] != 'N/A' else None,
                data['release_date'] if data['release_date'] and data['release_date'] != 'N/A' else None,
                data['release_year'] if data['release_year'] and data['release_year'] != 'N/A' else None,
                data['starring'] if data['starring'] and data['starring'] != 'N/A' else None,
                data['director'] if data['director'] and data['director'] != 'N/A' else None,
                data['rating'] if data['rating'] and data['rating'] != 'N/A' else None,
                data['poster_path'] if data['poster_path'] and data['poster_path'] != 'N/A' else None,
                data['download_links'] if data['download_links'] else None,
                data['movie_link'] if data['movie_link'] and data['movie_link'] != 'N/A' else None
            ]

            cur.execute("""
                INSERT INTO movies (
                    unique_id, name, description, category, genre, release_date, release_year,
                    starring, director, rating, poster_path, download_links, movie_link
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (name, release_year) DO NOTHING
            """, values)
            conn.commit()
            logger.info(f"✅ Inserted movie: {data['name']} with unique_id: {unique_id}")
            return True
    except Exception as e:
        logger.error(f"❌ Error inserting into DB: {e}")
        return False

# Execute cURL command and return response
def curl_get(url: str, timeout: int = 8) -> Optional[str]:
    try:
        cmd = [
            'curl', '-s', '-L',
            '--connect-timeout', str(timeout),
            '--max-time', str(timeout + 2),
            url
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ cURL error for {url}: {e}")
        return None

# Extract movie details from BeautifulSoup object
def extract_movie_data(soup: BeautifulSoup, base_url: str) -> Dict:
    data = {
        'name': 'N/A',
        'description': 'N/A',
        'category': 'N/A',
        'genre': 'N/A',
        'release_date': 'N/A',
        'release_year': 'N/A',
        'starring': 'N/A',
        'director': 'N/A',
        'rating': 'N/A',
        'poster_path': 'N/A',
        'download_links': '',
        'movie_link': 'N/A'
    }

    # Extract details from jatt1 or jatt classes
    jatt_divs = soup.find_all('div', class_=['jatt1', 'jatt'])
    for div in jatt_divs:
        text = div.get_text(strip=True)
        if 'Movie Description :' in text:
            data['description'] = text.split('Movie Description :', 1)[1].strip()
        elif 'Movie Name :' in text:
            data['name'] = text.split('Movie Name :', 1)[1].strip()
        elif 'Movie Category :' in text:
            data['category'] = text.split('Movie Category :', 1)[1].strip()
        elif 'Genre :' in text:
            data['genre'] = text.split('Genre :', 1)[1].strip()
        elif 'Release Date :' in text:
            data['release_date'] = text.split('Release Date :', 1)[1].strip()
        elif 'Staring :' in text:
            data['starring'] = text.split('Staring :', 1)[1].strip()
        elif 'Director :' in text:
            data['director'] = text.split('Director :', 1)[1].strip()
        elif 'Rating :' in text:
            data['rating'] = text.split('Rating :', 1)[1].strip()

    # Fallback to specific classes if not found in jatt
    if data['description'] == 'N/A':
        desc = soup.find('div', class_='description')
        data['description'] = desc.get_text(strip=True) if desc else 'N/A'
    if data['name'] == 'N/A':
        name = soup.find('div', class_='moviename')
        data['name'] = name.get_text(strip=True) if name else 'N/A'
    if data['category'] == 'N/A':
        cat = soup.find('div', class_='category')
        data['category'] = cat.get_text(strip=True) if cat else 'N/A'
    if data['genre'] == 'N/A':
        genre = soup.find('div', class_='genre')
        data['genre'] = genre.get_text(strip=True) if genre else 'N/A'
    if data['release_date'] == 'N/A':
        date = soup.find('div', class_='releasedate')
        data['release_date'] = date.get_text(strip=True) if date else 'N/A'
    if data['starring'] == 'N/A':
        star = soup.find('div', class_='starring')
        data['starring'] = star.get_text(strip=True) if star else 'N/A'
    if data['director'] == 'N/A':
        dir = soup.find('div', class_='director')
        data['director'] = dir.get_text(strip=True) if dir else 'N/A'
    if data['rating'] == 'N/A':
        rate = soup.find('div', class_='rating')
        data['rating'] = rate.get_text(strip=True) if rate else 'N/A'

    # Extract poster path
    poster_img = soup.find('img', class_='posterss')
    if poster_img and poster_img.get('src'):
        poster_path = urlparse(poster_img['src']).path
        data['poster_path'] = poster_path.lstrip('/')

    # Extract release year from name
    year_match = re.search(r'\((\d{4})\)', data['name'])
    data['release_year'] = year_match.group(1) if year_match else 'N/A'

    # Extract download links
    download_links = []
    mast_divs = soup.find_all('div', class_='mast', style=lambda x: x and 'text-align:left' in x)
    for div in mast_divs:
        for a_tag in div.find_all('a', href=True):
            link = a_tag['href']
            link_path = urlparse(link).path.lstrip('/')
            if link_path and ('download' in link.lower() or link_path.endswith(('.mp4', '.mkv', '.avi'))):
                download_links.append(link_path)

    # Additional download links
    for a_tag in soup.find_all('a', href=True, rel='nofollow'):
        link = a_tag['href']
        link_path = urlparse(link).path.lstrip('/')
        if link_path and ('download' in link.lower() or link_path.endswith(('.mp4', '.mkv', '.avi'))):
            download_links.append(link_path)

    data['download_links'] = ','.join(set(download_links))

    # Extract movie link from mast div
    for mast_div in mast_divs:
        a_tag = mast_div.find('a', href=True)
        if a_tag:
            href = a_tag['href']
            link_path = urlparse(href).path.lstrip('/')
            if link_path.endswith('.html') and 'movie' in link_path.lower():
                data['movie_link'] = link_path
                break

    return data

# Scrape all movie links from a listing page
def get_movie_links(soup: BeautifulSoup, base_url: str, category: str) -> List[str]:
    movie_links = set()
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        link_path = urlparse(href).path.lstrip('/')
        # Filter for movie listing links
        if (href.endswith('.html') and 
            '-' in href and 
            '/page/' not in href and 
            '&p=' not in href and 
            'download' not in href.lower() and 
            category.lower() in href.lower()):
            if link_path:
                movie_links.add(link_path)
    return list(movie_links)

# Recursively scrape movie details
def scrape_movie_details(conn, base_url: str, path: str, visited_urls: set, category: str, depth: int = 0, max_depth: int = 3) -> bool:
    if depth > max_depth or path in visited_urls:
        return False

    full_url = urljoin(base_url, path)
    logger.info(f"🔍 Scraping movie at depth {depth}: {full_url}")

    html_content = curl_get(full_url)
    if not html_content:
        logger.error(f"❌ Failed to fetch: {full_url}")
        return False

    soup = BeautifulSoup(html_content, 'html.parser')
    movie_data = extract_movie_data(soup, base_url)

    # Check for missing critical fields
    critical_fields = ['name', 'description', 'genre', 'rating', 'starring', 'director']
    missing_fields = [field for field in critical_fields if movie_data[field] == 'N/A']

    # Store initial data if name is present
    if movie_data['name'] != 'N/A':
        insert_movie_data(conn, movie_data)
        visited_urls.add(path)

    # Continue searching inner links if fields are missing
    if missing_fields and depth < max_depth:
        inner_links = get_movie_links(soup, base_url, category)
        for inner_path in inner_links:
            if inner_path != path and inner_path not in visited_urls:
                inner_html = curl_get(urljoin(base_url, inner_path))
                if inner_html:
                    inner_soup = BeautifulSoup(inner_html, 'html.parser')
                    inner_data = extract_movie_data(inner_soup, base_url)
                    # Update missing fields
                    for field in missing_fields:
                        if inner_data[field] != 'N/A':
                            movie_data[field] = inner_data[field]
                    # Update download links
                    if inner_data['download_links']:
                        movie_data['download_links'] = ','.join(set(
                            movie_data['download_links'].split(',') + 
                            inner_data['download_links'].split(',')
                        )).strip(',')
                    # Update movie link if better one found
                    if inner_data['movie_link'] != 'N/A':
                        movie_data['movie_link'] = inner_data['movie_link']
                    # Re-insert updated data
                    if movie_data['name'] != 'N/A':
                        inserted = insert_movie_data(conn, movie_data)
                        if inserted:
                            visited_urls.add(inner_path)
                            return True
                # Continue recursion
                success = scrape_movie_details(
                    conn, base_url, inner_path, visited_urls, category, depth + 1, max_depth
                )
                if success:
                    visited_urls.add(inner_path)
                    return True

    # Return True if data was inserted
    return movie_data['name'] != 'N/A'

# Scrape entire website
def scrape_website(base_url: str, listing_path: str, max_pages: int = 100):
    conn = create_connection()
    if not conn:
        return

    try:
        create_movies_table(conn)
        visited_urls = set()
        page = 1
        category = "hollywood" if "hollywood" in listing_path.lower() else "movies"

        while page <= max_pages:
            base_path = listing_path.lstrip('/')
            paged_url = f"{base_url.rstrip('/')}/{base_path}" if page == 1 else f"{base_url.rstrip('/')}/{base_path}&p={page}"
            logger.info(f"🌐 Scraping page: {paged_url}")

            html_content = curl_get(paged_url)
            if not html_content:
                logger.info("❌ No more pages or error occurred")
                break

            soup = BeautifulSoup(html_content, 'html.parser')
            movie_links = get_movie_links(soup, base_url, category)

            if not movie_links:
                logger.info("ℹ️ No movie links found on this page")
                break

            for movie_path in movie_links:
                if movie_path not in visited_urls:
                    scrape_movie_details(conn, base_url, movie_path, visited_urls, category)
                    time.sleep(0.5)  # Fast but respectful delay

            page += 1
            time.sleep(1)  # Reduced delay between pages

        logger.info("✅ Scraping completed")
    except Exception as e:
        logger.error(f"❌ Fatal error during scraping: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    BASE_URL = "https://www.mp4moviez.shoes"
    LISTING_PATH = "338/latest-hollywood-movies-(2025).html"
    scrape_website(BASE_URL, LISTING_PATH)
import os
import psycopg2
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_connection():
    try:
        tembo_uri = os.getenv("DATABASE_URL")
        
        # Ensure TEMBO_URI is provided
        if not tembo_uri:
            raise ValueError("DATABASE_URL environment variable is not set.")
        
        # Connect through the proxy (Ensure your proxy server is set up correctly)
        conn = psycopg2.connect(tembo_uri)
        
        logger.info("✅ Connected to the database through proxy")
        return conn
    
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return None

# Call the create_connection function
create_connection()

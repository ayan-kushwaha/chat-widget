import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

from src.core.config import settings

# Centralized Gemini Client for Vertex AI / GenAI SDK
# This is the single source of truth for the AI client instance.
def get_gemini_client():
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    api_key = os.environ.get("CLUAIZ_GEMINI_KEY")
    
    print(f"DEBUG: Initializing Gemini Client...")
    
    # Priority 1: Service Account JSON (Recommended for Vertex AI)
    if credentials_path and os.path.exists(credentials_path):
        from google.oauth2 import service_account
        
        print(f"DEBUG: Loading credentials from: {credentials_path}")
        creds = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        project_id = creds.project_id
        
        from src.core.config import settings
        
        print(f"DEBUG: Using Service Account for project: {project_id}")
        return genai.Client(
            vertexai=True,
            project=project_id,
            location=settings.GOOGLE_CLOUD_LOCATION,
            credentials=creds
        )
    
    # Priority 2: API Key (Standard Mode - AI Studio)
    api_key = api_key or settings.GOOGLE_CLOUD_API_KEY
    if api_key:
        return genai.Client(
            vertexai=False,
            api_key=api_key
        )
        
    print(f"DEBUG: No credentials found! Path: {credentials_path}, Exists: {os.path.exists(credentials_path) if credentials_path else 'N/A'}")
    raise ValueError("Neither GOOGLE_APPLICATION_CREDENTIALS nor CLUAIZ_GEMINI_KEY is set correctly.")

gemini_client = get_gemini_client()

# Global Model Constants
GEMINI_MODEL = settings.GEMINI_MODEL

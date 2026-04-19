from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "Cluaiz AI Engine"
    API_V1_STR: str = "/api/v1"
    PORT: int = 5000
    AI_ENGINE_URL: str = "http://ai_engine:5000"
    MONGO_URI: str = "mongodb://localhost:27017/cluaiz"
    REDIS_URL: str = "redis://localhost:6379"
    OPENAI_API_KEY: str | None = None
    QDRANT_URL: str = "http://localhost:6333"
    # Ollama Config (Local)
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL_SHADOW: str = "qwen3-vl:4b"  # The Master Gatekeeper (V5 Global Standard)
    OLLAMA_MODEL_EXPERT: str = "qwen3-vl:4b"  # Using shadow as default expert
    
    # Groq Config
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # Gemini Config
    GOOGLE_CLOUD_API_KEY: str | None = None
    GOOGLE_CLOUD_LOCATION: str = "us-central1"
    GEMINI_MODEL: str = "gemini-2.0-flash-lite-001"
    
    # Shopify Config
    SHOPIFY_SHOP_URL: str | None = None
    SHOPIFY_ACCESS_TOKEN: str | None = None
    
    # WooCommerce Config
    WOOCOMMERCE_STORE_URL: str | None = None
    WOOCOMMERCE_CONSUMER_KEY: str | None = None
    WOOCOMMERCE_CONSUMER_SECRET: str | None = None
    
    # Feature Flags
    ENABLE_GROQ: bool = True
    ENABLE_GEMINI: bool = True
    ENABLE_OLLAMA: bool = False
    USE_MODEL: str = "ollama"
    
    # Embeddings
    OLLAMA_EMBED_MODEL: str = "bge-m3:latest"

    # MinIO Config (Storage) - Same as Backend
    MINIO_ENDPOINT: str = "127.0.0.1:9000"
    MINIO_ACCESS_KEY: str = "admin"
    MINIO_SECRET_KEY: str = "password123"
    MINIO_BUCKET: str = "cluaiz-chats"
    MINIO_SECURE: bool = False

    # ClickHouse Config (Analytical Memory)
    CLICKHOUSE_HOST: str = "127.0.0.1"
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_USER: str = "cluaiz_engine"
    CLICKHOUSE_PASSWORD: str = "vault_pass_2026"
    CLICKHOUSE_DB: str = "cluaiz"

    # WhatsApp Cloud API (for HITL Gate notifications)
    WHATSAPP_TOKEN: str = ""           # Graph API bearer token
    WHATSAPP_PHONE_ID: str = ""        # Sending phone number ID
    OWNER_WHATSAPP_NUMBER: str = ""    # Boss's WhatsApp number (E.164 format: +91...)
    WHATSAPP_VERIFY_TOKEN: str = "cluaiz_webhook_verify"  # For webhook handshake

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

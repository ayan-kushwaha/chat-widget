import uuid
from datetime import datetime

def generate_request_id():
    return str(uuid.uuid4())

def get_timestamp():
    return datetime.utcnow().isoformat()

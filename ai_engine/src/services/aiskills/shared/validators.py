import re
from typing import List, Dict, Any, Optional

def is_valid_email(email: str) -> bool:
    """Standard email validation regex."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def is_valid_indian_phone(phone: str) -> bool:
    """Validates 10-digit Indian mobile numbers."""
    pattern = r'^[6-9]\d{9}$'
    # Clean string first
    clean_phone = re.sub(r'[\s\-\+\(\)]', '', phone)
    if clean_phone.startswith('91'):
        clean_phone = clean_phone[2:]
    return bool(re.match(pattern, clean_phone))

def is_valid_gstin(gstin: str) -> bool:
    """Validates Indian GST Identification Number."""
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    return bool(re.match(pattern, gstin.upper()))

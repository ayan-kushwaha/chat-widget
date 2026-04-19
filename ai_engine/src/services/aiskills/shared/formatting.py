import json
from typing import Any, Dict, List

def clean_for_llm(data: Any) -> str:
    """Converts complex objects/lists into clean, human-readable strings for the LLM context."""
    if isinstance(data, (dict, list)):
        return json.dumps(data, indent=2)
    return str(data)

def generate_markdown_table(headers: List[str], rows: List[List[Any]]) -> str:
    """Creates a markdown table from data for the UI/LLM."""
    if not rows:
        return "No data available."
        
    table = "| " + " | ".join(headers) + " |\n"
    table += "| " + " | ".join(["---"] * len(headers)) + " |\n"
    
    for row in rows:
        table += "| " + " | ".join(map(str, row)) + " |\n"
    
    return table

def mask_pii(text: str) -> str:
    """Basic mask for phone/email in logs (Placeholder for security/pii_masking.py)."""
    # Simple regex for email masking: a***@example.com
    email_pattern = r'([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
    text = re.sub(email_pattern, r'\1***@\2', text)
    return text

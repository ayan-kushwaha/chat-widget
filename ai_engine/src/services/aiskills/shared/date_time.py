from datetime import datetime
import pytz
from typing import Optional

def get_current_time_ist(format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Returns current time in IST."""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist).strftime(format_str)

def format_date_readable(date_str: str, input_format: str = "%Y-%m-%d") -> str:
    """Converts YYYY-MM-DD to '12th Oct 2023' style."""
    try:
        dt = datetime.strptime(date_str, input_format)
        day = dt.day
        if 4 <= day <= 20 or 24 <= day <= 30:
            suffix = "th"
        else:
            suffix = ["st", "nd", "rd"][day % 10 - 1]
        return dt.strftime(f"{day}{suffix} %b %Y")
    except Exception:
        return date_str

def get_relative_time_display(dt: datetime) -> str:
    """Returns '2 hours ago' etc."""
    now = datetime.now(pytz.utc)
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days} days ago"
    seconds = diff.seconds
    if seconds > 3600:
        return f"{seconds // 3600} hours ago"
    if seconds > 60:
        return f"{seconds // 60} minutes ago"
    return "Just now"

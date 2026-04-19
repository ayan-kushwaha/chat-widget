def check_calendar(date: str):
    """
    Check availability for a given date.
    Args:
        date: The date to check (YYYY-MM-DD).
    """
    return f" Checking calendar for {date}... Found 3 slots: 10:00 AM, 2:00 PM, 4:30 PM."

def book_slot(name: str, date: str, time: str):
    """
    Book a slot on the calendar.
    Args:
        name: Name of the person booking.
        date: Date of meeting.
        time: Time of meeting.
    """
    return f" Meeting confirmed for {name} on {date} at {time}."

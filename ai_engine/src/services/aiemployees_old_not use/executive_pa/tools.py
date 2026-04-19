def manage_schedule(action: str, details: str):
    """
    Manage the executive calendar.
    Args:
        action: 'Block', 'Clear', 'Move'.
        details: Time/Reason.
    """
    return f" Schedule Updated: {action} time slot ({details}). Calendar synced."

def book_flight(destination: str, date: str, preference: str):
    """
    Search and book travel.
    Args:
        destination: Where to go.
        date: When.
        preference: 'Business', 'Economy', 'Window'.
    """
    return f" Flight Found: {destination} on {date} ({preference}). Price: $450. Hold confirmed."

import functools
import time
from src.utils.logger import logger

def performance_check(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        end = time.time()
        logger.info(f"Performance: {func.__name__} took {end - start:.4f}s")
        return result
    return wrapper

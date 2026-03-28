import traceback
from src.engine_core import get_engine
try:
    e = get_engine()
    e.generate('test')
except Exception as err:
    traceback.print_exc()

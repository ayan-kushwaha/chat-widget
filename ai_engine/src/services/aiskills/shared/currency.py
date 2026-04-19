from typing import Union
from loguru import logger

def format_inr(amount: Union[int, float]) -> str:
    """Formats an amount into Indian Rupee style (X,XX,XXX.XX)."""
    try:
        s, last3, res = str(round(amount, 2)), "", ""
        if "." in s:
            res = s[s.index("."):]
            s = s[:s.index(".")]
        
        if len(s) <= 3:
            return f"{s}{res}"
            
        last3 = s[-3:]
        other = s[:-3]
        
        # Format the thousands part
        other_rev = other[::-1]
        formatted_other = ""
        for i in range(0, len(other_rev), 2):
            formatted_other += other_rev[i:i+2] + ","
        
        res = f"{formatted_other[::-1].strip(',')},{last3}{res}"
        return res
    except Exception as e:
        logger.error(f" Currency formatting failed: {e}")
        return f"{amount}"

def usd_to_inr(usd_amount: float, rate: float = 83.5) -> float:
    """Simple converter (Default rate 83.5)."""
    return round(usd_amount * rate, 2)

def calculate_gst(amount: float, rate: int = 18) -> float:
    """Calculates GST amount."""
    return round((amount * rate) / 100, 2)

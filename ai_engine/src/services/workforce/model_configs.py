"""
Model-Specific Configurations for Training
Optimized settings for different Gemini models
"""

from typing import Dict, Any

# Model configurations with optimal parameters
MODEL_CONFIGS = {
    # Flash 2.0 (Fast & Affordable)
    "gemini-2.0-flash-lite": {
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 40,
        "max_output_tokens": 8192,
        "description": "Fast, cost-effective for simple protocol cards"
    },
    
    "gemini-2.0-flash": {
        "temperature": 0.6,
        "top_p": 0.85,
        "top_k": 35,
        "max_output_tokens": 8192,
        "description": "Balanced speed and quality for most use cases"
    },
    
    # Flash 2.5 (Best Value)
    "gemini-2.5-flash-lite": {
        "temperature": 0.65,
        "top_p": 0.88,
        "top_k": 38,
        "max_output_tokens": 8192,
        "description": "Improved reasoning at Flash speed"
    },
    
    "gemini-2.5-flash": {
        "temperature": 0.5,
        "top_p": 0.8,
        "top_k": 30,
        "max_output_tokens": 8192,
        "description": "Best balance of quality and cost"
    },
    
    # Pro 2.0 (Highest Quality)
    "gemini-2.0-pro": {
        "temperature": 0.4,
        "top_p": 0.75,
        "top_k": 25,
        "max_output_tokens": 8192,
        "description": "Maximum accuracy for complex business rules"
    }
}

def get_model_config(model_key: str) -> Dict[str, Any]:
    """
    Get configuration for specified model.
    Falls back to Flash 2.0 if model not found.
    """
    return MODEL_CONFIGS.get(model_key, MODEL_CONFIGS["gemini-2.0-flash"])

def get_training_config(model_key: str, role: str = "generic") -> Dict[str, Any]:
    """
    Get complete training configuration including role-specific adjustments.
    
    Args:
        model_key: Model identifier (e.g., "gemini-2.0-flash")
        role: AI employee role (e.g., "sales", "support", "hr")
    
    Returns:
        Complete config dict for Gemini API
    """
    base_config = get_model_config(model_key)
    
    # Role-specific temperature adjustments
    role_adjustments = {
        "sales": {"temperature": base_config["temperature"] + 0.1},  # More creative
        "support": {"temperature": base_config["temperature"] - 0.1},  # More precise
        "hr": {"temperature": base_config["temperature"]},  # Balanced
        "accountant": {"temperature": base_config["temperature"] - 0.2}  # Very precise
    }
    
    # Apply role adjustment if available
    if role.lower() in role_adjustments:
        adjusted_config = base_config.copy()
        adjusted_config.update(role_adjustments[role.lower()])
        return adjusted_config
    
    return base_config

# Safety settings for all models
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"}
]

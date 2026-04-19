from google.genai import types
from src.core.gemini_client import GEMINI_MODEL

def get_default_config(
    temperature: float = 0.7, 
    max_output_tokens: int = 2048,
    response_mime_type: str = "text/plain",
    response_schema: dict = None,
    tools: list = None,
    system_instruction: str = None
) -> types.GenerateContentConfig:
    """
    Returns a standard GenerateContentConfig with safety settings set to OFF.
    """
    return types.GenerateContentConfig(
        temperature=temperature,
        top_p=0.95,
        max_output_tokens=max_output_tokens,
        response_mime_type=response_mime_type,
        response_schema=response_schema,
        tools=tools,
        system_instruction=system_instruction,
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF"),
        ]
    )

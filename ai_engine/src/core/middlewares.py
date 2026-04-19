import time
import json
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
from loguru import logger

class ResourceMetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        
        # Process the request
        response = await call_next(request)
        
        #  Dynamic Intensity Detection
        path = request.url.path
        density = 0.5 # Default
        if "/chat" in path: density = 0.2
        elif "/voice" in path: density = 0.9
        elif "/crawl" in path: density = 0.7
        elif "/upload" in path: density = 0.3
        elif "/workforce" in path: density = 0.8
        elif "/analysis" in path: density = 0.6
        
        # Calculate duration
        process_time = time.perf_counter() - start_time
        
        # Only inject metrics if it's a JSON response and success
        content_type = response.headers.get("content-type", "")
        if response.status_code == 200 and "application/json" in content_type:
            try:
                # We need to read the body. For simple JSON responses, this is fine.
                # If the response is a StreamingResponse, we might need a different approach.
                if isinstance(response, StreamingResponse):
                    return response # Don't touch streams for now

                # Read body
                body = b""
                async for chunk in response.body_iterator:
                    body += chunk
                
                # Parse JSON
                data = json.loads(body.decode())
                
                # Calculate Network Usage (Request + Response)
                request_size = int(request.headers.get("content-length", 0))
                response_size = len(body)
                net_mb = round((request_size + response_size) / (1024 * 1024), 6)

                # Inject Metrics
                if isinstance(data, dict):
                    data["resource_metrics"] = {
                        "cpu_secs": round(process_time, 4),
                        "net_mb": net_mb,
                        "task_density": density,
                        "api_calls": 1 # Standard call count
                    }
                    
                    # Create new response
                    new_body = json.dumps(data).encode()
                    return Response(
                        content=new_body,
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        media_type="application/json"
                    )
            except Exception as e:
                logger.warning(f" Failed to inject resource metrics: {e}")
                
        return response

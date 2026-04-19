"""
Dynamic API Handler Service
Handles real-time API queries with GET/POST support, authentication, and caching
"""

from typing import Dict, Any, Optional, List
import httpx
import json
from jinja2 import Template
import asyncio
from datetime import datetime, timedelta
import hashlib

class FlexibleAPIHandler:
    """
    Enterprise-grade API handler with support for:
    - GET/POST methods
    - Multiple auth types (API Key, Bearer, Basic)
    - Template-based POST bodies
    - Redis caching
    - Pagination
    - Field mapping
    """
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.timeout = 10.0
        self.max_retries = 2
    
    async def execute_query(
        self,
        api_source: Dict[str, Any],
        query: str,
        filters: Optional[Dict[str, str]] = None,
        page: int = 1
    ) -> Dict[str, Any]:
        """
        Execute API request with dynamic parameters
        
        Args:
            api_source: ApiSource configuration from MongoDB
            query: User's search query
            filters: Additional filters (e.g., {"department": "CS"})
            page: Page number for pagination
        
        Returns:
            Formatted API response with results and metadata
        """
        
        # 1. Check Cache
        if self.redis and api_source.get('cacheConfig', {}).get('enabled'):
            cache_key = self._generate_cache_key(
                str(api_source['_id']), 
                query, 
                filters, 
                page
            )
            cached = await self._get_from_cache(cache_key)
            if cached:
                cached['from_cache'] = True
                return cached
        
        # 2. Build and Execute Request
        try:
            if api_source['method'] == 'GET':
                response_data = await self._execute_get(api_source, query, filters, page)
            else:
                response_data = await self._execute_post(api_source, query, filters, page)
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'query': query
            }
        
        # 3. Format Response
        formatted = self._format_response(
            response_data, 
            api_source.get('fieldMapping', {})
        )
        
        # 4. Cache Result
        if self.redis and api_source.get('cacheConfig', {}).get('enabled'):
            ttl = api_source['cacheConfig']['ttlMinutes'] * 60
            await self._save_to_cache(cache_key, formatted, ttl)
        
        formatted['from_cache'] = False
        formatted['timestamp'] = datetime.utcnow().isoformat()
        return formatted
    
    async def _execute_get(
        self,
        api_source: Dict[str, Any],
        query: str,
        filters: Optional[Dict[str, str]],
        page: int
    ) -> Dict[str, Any]:
        """Execute GET request with query params"""
        
        # Build query parameters
        params = {
            api_source['requestConfig']['searchParam']: query
        }
        
        # Add pagination
        pagination = api_source['requestConfig'].get('paginationParams')
        if pagination:
            params[pagination['pageParam']] = page
            params[pagination['limitParam']] = pagination['defaultLimit']
        
        # Add custom filters
        if filters:
            params.update(filters)
        
        # Build headers
        headers = self._build_auth_headers(api_source)
        
        # Execute request with retries
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(
                        api_source['endpoint'],
                        params=params,
                        headers=headers
                    )
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPError as e:
                if attempt == self.max_retries:
                    raise Exception(f"API request failed after {self.max_retries} retries: {str(e)}")
                await asyncio.sleep(1)  # Wait before retry
    
    async def _execute_post(
        self,
        api_source: Dict[str, Any],
        query: str,
        filters: Optional[Dict[str, str]],
        page: int
    ) -> Dict[str, Any]:
        """Execute POST request with template-based body"""
        
        # Prepare template context
        context = {
            'query': query,
            'page': page,
            **(filters or {})
        }
        
        # Add pagination to context if configured
        pagination = api_source['requestConfig'].get('paginationParams')
        if pagination:
            context['limit'] = pagination['defaultLimit']
        
        # Render body template
        template_str = api_source['requestConfig'].get('bodyTemplate', '{}')
        template = Template(template_str)
        rendered = template.render(context)
        body = json.loads(rendered)
        
        # Build headers
        headers = self._build_auth_headers(api_source)
        headers['Content-Type'] = 'application/json'
        
        # Execute request with retries
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        api_source['endpoint'],
                        json=body,
                        headers=headers
                    )
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPError as e:
                if attempt == self.max_retries:
                    raise Exception(f"API request failed after {self.max_retries} retries: {str(e)}")
                await asyncio.sleep(1)
    
    def _build_auth_headers(self, api_source: Dict[str, Any]) -> Dict[str, str]:
        """Build authentication headers based on auth type"""
        headers = {}
        auth_type = api_source.get('authType', 'none')
        auth_creds = api_source.get('authCredentials', {})
        
        if auth_type == 'api-key':
            header_name = auth_creds.get('headerName', 'X-API-Key')
            headers[header_name] = auth_creds.get('apiKey', '')
        
        elif auth_type == 'bearer':
            headers['Authorization'] = f"Bearer {auth_creds.get('token', '')}"
        
        elif auth_type == 'basic':
            import base64
            username = auth_creds.get('username', '')
            password = auth_creds.get('password', '')
            credentials = f"{username}:{password}"
            encoded = base64.b64encode(credentials.encode()).decode()
            headers['Authorization'] = f"Basic {encoded}"
        
        return headers
    
    def _format_response(
        self,
        raw_data: Any,
        field_mapping: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Transform API response using field mapping"""
        
        # Extract items from response (handle different structures)
        items = self._extract_items(raw_data)
        
        # Map fields
        formatted_items = []
        for item in items:
            if not isinstance(item, dict):
                continue
            
            formatted = {}
            if field_mapping:
                for api_field, config in field_mapping.items():
                    if api_field in item:
                        formatted[config['displayName']] = item[api_field]
            else:
                # No mapping, use raw data
                formatted = item
            
            formatted_items.append(formatted)
        
        return {
            'success': True,
            'count': len(formatted_items),
            'results': formatted_items
        }
    
    def _extract_items(self, data: Any) -> List[Dict]:
        """Extract list of items from various response structures"""
        
        if isinstance(data, list):
            return data
        
        if isinstance(data, dict):
            # Try common list keys
            for key in ['data', 'results', 'items', 'records', 'rows']:
                if key in data and isinstance(data[key], list):
                    return data[key]
            
            # If single object, wrap in list
            return [data]
        
        return []
    
    def _generate_cache_key(
        self,
        api_id: str,
        query: str,
        filters: Optional[Dict],
        page: int
    ) -> str:
        """Generate unique cache key"""
        key_parts = [
            api_id,
            query,
            json.dumps(filters or {}, sort_keys=True),
            str(page)
        ]
        combined = "|".join(key_parts)
        hash_obj = hashlib.sha256(combined.encode())
        return f"api_query:{hash_obj.hexdigest()[:16]}"
    
    async def _get_from_cache(self, key: str) -> Optional[Dict]:
        """Retrieve from Redis cache"""
        if not self.redis:
            return None
        
        try:
            cached = self.redis.get(key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            print(f"Cache read error: {e}")
        
        return None
    
    async def _save_to_cache(self, key: str, data: Dict, ttl: int):
        """Save to Redis cache"""
        if not self.redis:
            return
        
        try:
            self.redis.setex(key, ttl, json.dumps(data))
        except Exception as e:
            print(f"Cache write error: {e}")

"""
Function Calling Integration for Live API Queries
Enables AI to detect queries that need real-time data and execute API calls
"""

from typing import Dict, Any, Optional, List
import re

# Try importing with correct path
try:
    from src.services.api_handler_service import FlexibleAPIHandler
except ImportError:
    # Fallback for different project structures
    from api_handler_service import FlexibleAPIHandler

class FunctionCallingService:
    """
    Intelligent query router that determines when to use live APIs
    vs static knowledge base
    """
    
    def __init__(self, api_handler: FlexibleAPIHandler, mongodb_client=None):
        self.api_handler = api_handler
        self.db = mongodb_client
        
        # If no MongoDB client provided, try to get from environment
        if not self.db:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                import os
                mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
                client = AsyncIOMotorClient(mongo_uri)
                self.db = client.get_default_database()
            except Exception as e:
                print(f"Warning: MongoDB not connected for FunctionCalling: {e}")
                self.db = None
    
    async def should_use_api(self, user_query: str, api_source: Dict[str, Any]) -> bool:
        """
        Determine if query needs live API data
        
        Args:
            user_query: User's question
            api_source: ApiSource configuration
        
        Returns:
            True if API should be called, False if static knowledge is enough
        """
        
        # Keywords that indicate need for live data
        live_keywords = [
            'current', 'latest', 'today', 'now', 'real-time',
            'status', 'available', 'show me', 'list',
            'how many', 'count', 'search for'
        ]
        
        query_lower = user_query.lower()
        
        # Check if query contains live data indicators
        for keyword in live_keywords:
            if keyword in query_lower:
                return True
        
        # Check if API name is mentioned
        api_name = api_source.get('name', '').lower()
        if api_name and api_name in query_lower:
            return True
        
        return False
    
    async def extract_search_params(
        self,
        user_query: str,
        api_source: Dict[str, Any]
    ) -> tuple[str, Optional[Dict[str, str]]]:
        """
        Extract search query and filters from user's question
        
        Returns:
            (query_string, filters_dict)
        """
        
        # Simple extraction for now
        # TODO: Use LLM to extract structured parameters
        
        query = user_query
        filters = {}
        
        # Extract common filter patterns
        # Example: "students from CS department" -> {department: "CS"}
        dept_match = re.search(r'(?:from|in|at)\s+([A-Z]{2,4})\s+(?:department|dept)', user_query, re.IGNORECASE)
        if dept_match:
            filters['department'] = dept_match.group(1).upper()
        
        # Extract search terms (remove filter parts)
        query = re.sub(r'(?:from|in|at)\s+[A-Z]{2,4}\s+(?:department|dept)', '', query, flags=re.IGNORECASE)
        query = query.strip()
        
        return query, filters if filters else None
    
    async def execute_function_call(
        self,
        user_query: str,
        org_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Main entry point: Check if query needs API, execute if needed
        
        Returns:
            API results if applicable, None if should use static knowledge
        """
        
        # 1. Get active API sources for this org
        api_sources = await self._get_active_api_sources(org_id)
        
        if not api_sources:
            return None
        
        # 2. Check each API source
        for api_source in api_sources:
            if await self.should_use_api(user_query, api_source):
                # 3. Extract parameters
                query, filters = await self.extract_search_params(user_query, api_source)
                
                # 4. Execute API call
                try:
                    results = await self.api_handler.execute_query(
                        api_source,
                        query,
                        filters
                    )
                    
                    if results.get('success'):
                        return {
                            'source': 'live_api',
                            'api_name': api_source['name'],
                            'data': results,
                            'query': query,
                            'filters': filters
                        }
                except Exception as e:
                    print(f"API call failed: {e}")
                    continue
        
        return None
    
    async def _get_active_api_sources(self, org_id: str) -> List[Dict[str, Any]]:
        """Fetch all active API sources for organization"""
        
        try:
            cursor = self.db.apisources.find({
                'orgId': org_id,
                'isActive': True,
                'syncMode': 'real-time'
            })
            
            sources = await cursor.to_list(length=100)
            return sources
        except Exception as e:
            print(f"Error fetching API sources: {e}")
            return []
    
    def format_api_results_for_llm(self, api_response: Dict[str, Any]) -> str:
        """
        Convert API JSON response to natural language context for LLM
        
        Args:
            api_response: Result from execute_function_call
        
        Returns:
            Formatted text ready for LLM context
        """
        
        data = api_response['data']
        results = data.get('results', [])
        count = data.get('count', 0)
        
        if count == 0:
            return f"No results found from {api_response['api_name']}."
        
        # Format results as structured text
        context_lines = [
            f"Live data from {api_response['api_name']}:",
            f"Found {count} result(s):",
            ""
        ]
        
        for i, item in enumerate(results[:10], 1):  # Limit to 10 for context window
            item_lines = [f"{i}. "]
            for key, value in item.items():
                item_lines.append(f"  - {key}: {value}")
            context_lines.append("\n".join(item_lines))
        
        if count > 10:
            context_lines.append(f"\n... and {count - 10} more results")
        
        return "\n".join(context_lines)

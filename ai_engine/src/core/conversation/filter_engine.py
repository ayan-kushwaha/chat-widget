"""
Filter & Feed Engine
Locally filters API data (products, orders) before feeding to LLM.
"""
from typing import List, Dict, Any, Optional

class FilterEngine:
    """Filters large datasets locally to reduce LLM context costs."""
    
    @staticmethod
    def filter_products(
        products: List[Dict[str, Any]],
        max_price: Optional[float] = None,
        min_price: Optional[float] = None,
        category: Optional[str] = None,
        search_term: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Filters Shopify/WooCommerce products locally.
        Returns top N filtered results.
        """
        filtered = products
        
        # Price filters
        if max_price:
            filtered = [p for p in filtered if p.get('price', 0) <= max_price]
        if min_price:
            filtered = [p for p in filtered if p.get('price', 0) >= min_price]
        
        # Category filter
        if category:
            filtered = [p for p in filtered if category.lower() in p.get('category', '').lower()]
        
        # Search term
        if search_term:
            filtered = [
                p for p in filtered 
                if search_term.lower() in p.get('name', '').lower() 
                or search_term.lower() in p.get('description', '').lower()
            ]
        
        # Return top N
        return filtered[:limit]
    
    @staticmethod
    def filter_orders(
        orders: List[Dict[str, Any]],
        status: Optional[str] = None,
        customer_id: Optional[str] = None,
        min_amount: Optional[float] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Filter orders locally."""
        filtered = orders
        
        if status:
            filtered = [o for o in filtered if o.get('status', '').lower() == status.lower()]
        if customer_id:
            filtered = [o for o in filtered if o.get('customer_id') == customer_id]
        if min_amount:
            filtered = [o for o in filtered if o.get('total', 0) >= min_amount]
        
        return filtered[:limit]
    
    @staticmethod
    def summarize_for_llm(items: List[Dict[str, Any]], item_type: str = "product") -> str:
        """
        Convert filtered items to concise LLM-friendly text.
        Instead of sending 500 products, send "Top 3 red shoes under 500".
        """
        if not items:
            return f"No {item_type}s found matching criteria."
        
        summary_lines = []
        for idx, item in enumerate(items, 1):
            if item_type == "product":
                line = f"{idx}. {item.get('name')} - {item.get('price')} ({item.get('category', 'General')})"
            elif item_type == "order":
                line = f"{idx}. Order #{item.get('id')} - {item.get('total')} ({item.get('status', 'unknown')})"
            else:
                line = f"{idx}. {item}"
            summary_lines.append(line)
        
        return "\n".join(summary_lines)

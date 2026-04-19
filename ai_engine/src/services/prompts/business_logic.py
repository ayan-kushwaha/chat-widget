from typing import Dict, List, Optional
from loguru import logger

class BusinessLogicEngine:
    """
    Layer 2: The Business Logic Switch.
    Injects specific rules (Product vs Service) into Agent Brain based on Business Context.
    """

    @staticmethod
    def generate_system_prompt(role: str, business_context: Dict[str, str]) -> str:
        """
        Generates dynamic system prompt additions based on business type and pricing model.
        
        Args:
            role: The role of the agent (e.g., "Sales Manager").
            business_context: Dict containing:
                - type: "product" | "service" | "both"
                - pricing: "fixed" | "dynamic"
                - tone: "casual" | "formal" (Optional)
        
        Returns:
            String containing the injected rules.
        """
        if not business_context:
            return ""

        if isinstance(business_context, str):
            business_context = {"description": business_context, "type": "product"}
            
        biz_type = business_context.get("type", "product").lower()
        pricing_model = business_context.get("pricing", "fixed").lower()
        
        rules = []

        # 1. Business Model Rules
        if biz_type == "product":
            rules.append("BUSINESS LOGIC: PRODUCT BASED")
            rules.append("- If user asks for an item, always check availability/stock first (simulate checking).")
            rules.append("- Focus on specs, shipping, and delivery times.")
        
        elif biz_type == "service":
            rules.append("BUSINESS LOGIC: SERVICE BASED")
            rules.append("- If user asks for a service, always check calendar/availability.")
            rules.append("- Focus on appointment slots, duration, and prerequisites.")
        
        elif biz_type == "both":
            rules.append("BUSINESS LOGIC: HYBRID (PRODUCT + SERVICE)")
            rules.append("- Context Aware: If user asks for physical item -> Check Stock. If user asks for session/class -> Check Calendar.")

        # 2. Pricing Rules
        if pricing_model == "fixed":
            rules.append("PRICING LOGIC: FIXED PRICE")
            rules.append("- You can quote prices directly from the catalog.")
            rules.append("- Do not offer discounts unless explicitly authorized in the knowledge base.")
            
        elif pricing_model == "dynamic":
            rules.append("PRICING LOGIC: DYNAMIC / QUOTATION BASED")
            rules.append("- NEVER quote a final price directly.")
            rules.append("- Collect requirements (Quantity, Location, Customization) first.")
            rules.append("- Say: 'I will generate a custom quote for you based on these details.'")

        # 3. Tone Injection (Optional)
        tone = business_context.get("tone", "professional").lower()
        if tone == "casual":
            rules.append("TONE: Casual & Friendly. Use emojis, short sentences. Act like a helpful friend.")
        elif tone == "formal":
            rules.append("TONE: Ultra-Professional. No slang. Be concise, polite, and authoritative.")

        logger.info(f" Injected Business Logic for {role}: Type={biz_type}, Pricing={pricing_model}")
        
        return "\n\n" + "\n".join(rules)

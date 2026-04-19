from .base_phase import BasePhase
from typing import Dict, Any

class Phase04Sales(BasePhase):
    PHASE_ID = "phase_04_sales"
    PHASE_NAME = "Sales & Pricing"
    PHASE_DESCRIPTION = "Handles pricing inquiries, discounts, negotiation (if allowed), and closing the deal."

    @staticmethod
    def get_prompt(context: Dict[str, Any]) -> str:
        # --- DYNAMIC INTERNAL LOGIC (The "Brain" within the Phase) ---
        # Instead of one static prompt, we detect the "Conversation Stage".
        
        history = context.get("history_summary", "").lower()
        last_user_msg = context.get("last_user_input", "").lower()
        
        # 1. Detect Sub-Case
        stage = "value_pitch" # Default
        
        if "price" in last_user_msg or "cost" in last_user_msg:
            stage = "price_reveal"
        elif "expensive" in last_user_msg or "discount" in last_user_msg:
            stage = "negotiation"
        elif "ok" in last_user_msg or "buy" in last_user_msg or "deal" in last_user_msg:
            stage = "closing"
            
        # 2. Select Specialized Prompt for that Stage
        config = context.get('sales_config', {})
        allow_bargain = config.get('allow_bargaining', False)

        prompt_map = {
            "value_pitch": """
                SUB-PHASE: VALUE FIRST
                User asked about the product. Do NOT tell the price yet.
                Focus on the transformation: "This tool will save you 10 hours a week."
                End with: "Would you like to see how it fits your workflow?"
            """,
            "price_reveal": """
                SUB-PHASE: PRICE REVEAL
                State the price clearly but sandwich it between benefits.
                "The investment is $X, which includes 24/7 support and the pro module."
                Be confident. Do not apologize for the price.
            """,
            "negotiation": f"""
                SUB-PHASE: NEGOTIATION
                User said it's expensive.
                Allowed to Discount: {allow_bargain}
                {"Strategy: Offer 10% off if they close NOW." if allow_bargain else "Strategy: Reiterate value. Compare with competitors who are costlier."}
            """,
            "closing": """
                SUB-PHASE: CLOSING
                User seems ready.
                Stop selling. Start processing.
                Output JSON: {"action": "generate_payment_link", "amount": "standard"}
            """
        }
        
        selected_logic = prompt_map.get(stage, prompt_map["value_pitch"])
        
        base_prompt = f"""
        ROLE: The Smart Salesman
        CURRENT STAGE: {stage.upper()}
        
        SPECIFIC INSTRUCTION:
        {selected_logic}
        """
        
        return BasePhase.inject_global_context(base_prompt, context)

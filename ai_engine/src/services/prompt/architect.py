from typing import List, Dict, Optional, Any
from src.utils.logger import logger

class PromptArchitect:
    """
    Rule 1: No hardcoded prompts.
    Assemble the final prompt JSON/String from dynamic building blocks.
    """
    
    @staticmethod
    def build_system_instruction(
        persona_config: Dict[str, Any],
        current_mission: Optional[str] = None,
        context_text: Optional[str] = None,
        auto_learned_facts: Optional[List[str]] = None,
        is_discovery_mode: bool = False,
        base_personality: str = "You are Cluaiz AI, a professional assistant.",
        org_name: str = "this organization",
        knowledge_topics: List[str] = []
    ) -> str:
        """
        Lego-brick assembly of the system instruction.
        """
        # 1. Base Identity
        persona_name = persona_config.get("name", "Cluaiz AI")
        persona_tone = persona_config.get("tone", "Professional yet friendly")
        persona_goal = persona_config.get("goal", base_personality)
        
        system_blocks = [
            f"IDENTITIY: You are {persona_name}, a specialized assistant for {org_name}.",
            f"TONE: Your tone is {persona_tone}.",
            f"CORE GOAL: {persona_goal}",
            f"FORMATTING RULES (STRICT):",
            f"1. Use Markdown TABLES for any comparative data or structured information.",
            f"2. Use BULLET POINTS or NUMBERED LISTS for steps and multiple items.",
            f"3. Use **bold** for emphasis on important terms.",
            f"4. NEVER use dry rejections; always be helpful and structured."
        ]
        
        # 2. Add Rules (Mapping from Mongoose Schema)
        rules = persona_config.get("restriction_rules", [])
        if not rules:
            rules = persona_config.get("rules", []) # Fallback
            
        if rules:
            system_blocks.append("STRICT OPERATIONAL RULES:\n- " + "\n- ".join(rules))
            
        # 3. Add Auto-Learned Facts
        if auto_learned_facts:
            system_blocks.append("ESTABLISHED CONTEXT (Fact-based Memory):\n- " + "\n- ".join(auto_learned_facts))

        # 4. Learning/Discovery Block
        if is_discovery_mode:
            discovery_prompt = [
                "USER INSIGHTS DETECTED: The user is providing specific details. Acknowledge this naturally within your response.",
                "INTEGRATION: Combine these new details with your core goal to provide a more personalized experience."
            ]
            system_blocks.append("\n".join(discovery_prompt))

        # 5. Add Current Mission (FROM FLOW/JOURNEY) - HIGHEST PRIORITY
        if current_mission:
            system_blocks.append(f"--- ACTIVE BUSINESS GOAL (High Priority) ---")
            system_blocks.append(f"CURRENT FOCUS: {current_mission}")
            system_blocks.append("CRITICAL: Guide the conversation toward this goal while remaining helpful.")

        # 6. Add Context (RAG)
        if context_text:
            system_blocks.append(f"--- VERIFIED KNOWLEDGE BASE ---")
            system_blocks.append(context_text)
            instruct = "Only use the provided knowledge base to answer specific business questions."
            if not is_discovery_mode:
                instruct += " If information is missing, politely offer what you DO know or ask relevant follow-up questions."
            system_blocks.append(f"INSTRUCTION: {instruct}")

        # 6. Rule 9: Expert Helpfulness & Context Usage
        specialization_rules = [
            f"EXPERT HELP OVERRIDE (Rule 9):",
            f"1. You are a high-level expert for {org_name}. Your objective is to ASSIST, not refuse.",
            f"2. IDENTITY DEFENSE: If the user asks 'What is {org_name}' or 'Who is {org_name}', you MUST describe the BUSINESS/ORGANIZATION based on the provided context.",
            f"   - VERBOTEN: Do NOT provide a generic dictionary definition (e.g. 'Ramu is a name').",
            f"   - VERBOTEN: Do NOT mention external entities (like film directors/actors) unless they are explicitly in the source text.",
            f"   - If no specific context exists, simply say: '{org_name} is the organization I assist.' and ask for more details.",
            f"3. KNOWLEDGE SYNTHESIS: Even if a specific chunk is missing, use the business descriptions, metadata, and conversational history to provide the most helpful answer possible.",
            f"4. NO APOLOGIES: Never start with 'I'm sorry' or 'I don't have information' unless the request is dangerously out of scope (e.g. news, general history).",
            f"5. ENTITY RECOGNITION: If the user mentions people, projects, or categories related to {org_name}, treat them with high priority and explain what you know.",
            f"6. DYNAMIC INTERACTION: Be conversational. If you have partial info, give it and ask follow-up questions to explore further.",
            f"7. PERSONALIZATION OVERRIDE: If 'PRIMARY USER DATA' contains a name, ALWAYS start by greeting the user with it (e.g., 'Hello Aryan'). Do NOT reveal their email or phone number unless explicitly asked."
        ]
        system_blocks.append("\n".join(specialization_rules))

        return "\n\n".join(system_blocks)

class LabelArchitect:
    """
    Generates natural, actionable questions for ADS suggestions.
    """
    
    @staticmethod
    async def build_suggestion_labels(query: str, sources: List[Dict[str, Any]], user_id: str = "system") -> List[Dict[str, Any]]:
        """
        Calls Gemini to turn raw source names into human-style questions.
        """
        from src.services.routing.local_llm_router import local_router
        import re
        
        # Clean source names before sending to Gemini for better context
        cleaned_sources = []
        for s in sources:
            clean_name = re.sub(r'\.(pdf|json|csv|xlsx?|txt)$', '', s['text'], flags=re.IGNORECASE)
            cleaned_sources.append({**s, "clean_text": clean_name})

        source_list = "\n".join([f"- ID: {s['id']}, Name: {s['clean_text']}, Info: {s.get('full_desc','')}" for s in cleaned_sources])
        
        prompt = f"""
        User asked: "{query}"
        I found these business records. Turn them into VERY SHORT, HUMAN-LIKE labels for buttons (max 35 chars).
        
        Records:
        {source_list}
        
        STRICT RULES:
        1. FORBIDDEN: Do NOT use ANY file extensions (.pdf, .json, .csv, etc).
        2. FORBIDDEN: Do NOT use technical words like "File", "Document", "JSON", "Database".
        3. YES: Use action phrases like "View pricing", "Learn about services", "Our story".
        4. Return ONLY a JSON array of objects: [{{"id": "...", "label": "..."}}]
        """
        
        try:
            labels = await local_router.json_reason(prompt, system="You are a professional UX writer. Use only Title Case. Return ONLY valid JSON.")
            
            # Map labels back to sources
            final_suggestions = []
            label_map = {item['id']: item['label'] for item in labels if 'id' in item and 'label' in item}
            
            for s in cleaned_sources:
                final_suggestions.append({
                    "id": s['id'],
                    "label": label_map.get(s['id'], s['clean_text']),
                    "type": s['type']
                })
                
            return final_suggestions
        except Exception as e:
            print(f" LabelArchitect Error: {e}")
            return [{"id": s['id'], "label": s['clean_text'], "type": s['type']} for s in cleaned_sources]

    @staticmethod
    async def generate_follow_up_questions(query: str, answer: str, history: List[Dict[str, Any]] = [], user_id: str = "system") -> List[Dict[str, Any]]:
        """
        Rule 14: Generates 0-4 actionable follow-up questions based on the conversation context.
        """
        from src.services.routing.local_llm_router import local_router
        
        # Extract previous user questions to avoid duplicates
        past_questions = [msg.get('content') or msg.get('text') for msg in history if msg.get('role') == 'user']
        context_summary = "\n".join(past_questions[-3:]) # Last 3 user queries
        
        prompt = f"""
        User just asked: "{query}"
        AI responded: "{answer}"
        Recent User Questions: {context_summary}
        
        Task: Decide if follow-up suggestion buttons are needed to help the user.
        
        STRICT RULES:
        1. RELEVANCE CHECK (CRITICAL): Only generate questions that logically follow the AI's last answer.
        2. USER PERSPECTIVE (CRITICAL):
           - The buttons are for the USER to click. They must be phrased as ACTIONS the user wants to take.
           -  BAD (AI asking User): "Can you tell me more?", "What information do you need?", "How can I help?"
           -  GOOD (User asking AI): "Show me pricing", "Explain features", "Contact support", "See examples".
        3. NO GENERIC "FILLER" QUESTIONS:
           -  BAD: "What can you do?", "How do I start?", "Tell me more"
           - Any question that simply restarts the conversation is FORBIDDEN.
        4. NO DUPLICATES: NEVER suggest a question the user has already asked.
        5. CONFIDENCE GATE: If no specific, high-value question exists, return an EMPTY ARRAY []. Do not force it.
        6. NO TECHNICAL JARGON: Do NOT mention any file extensions or "documents".
        7. OUTPUT FORMAT (CRITICAL): Return ONLY a valid JSON array of strings. Do NOT wrap in markdown.
           Example: ["Show pricing", "Contact sales"]
           OR
           Example: []
        """
        
        try:
            questions = await local_router.json_reason(prompt, system="You are a professional UX writer. Return ONLY valid JSON array. Be extremely concise.")
            
            if not isinstance(questions, list): return []
            
            # Map strings to standard options format
            return [{"id": f"sug_{i}", "label": str(q), "type": "suggestion"} for i, q in enumerate(questions[:4]) if isinstance(q, (str, int, float))]
        except Exception as e:
            logger.error(f" Failed to generate follow-up buttons: {e}")
            return []


class ClarificationArchitect:
    """
    Handles "Gray Zone" scenarios where the AI needs to ask identifying questions.
    """
    
    INTENT_BUTTON_MAPPING = {
        "sales": "Check Prices ",
        "booking": "Book Appointment ",
        "support": "Report Issue ",
        "discovery": "See Services ",
        "solution": "How it Works ",
        "identity_intent": "Register Me ",
        "knowledge": "Read Policy ",
        "greeting": "Say Hello "
    }

    @staticmethod
    def build_clarification_response(options: List[str], language: str = "en") -> str:
        """
        Generates a polite ambiguity response.
        """
        # Simple template-based for speed (can be LLM-based later)
        messages = {
            "en": "I'm not entirely sure what you mean. Did you want to...",
            "hinglish": "Samajh nahi aaya boss, kya aap ye karna chahte hain?",
            "hi": " ,          ?",
            "ur": "            "
        }
        
        base_msg = messages.get(language, messages["en"])
        return base_msg

    @staticmethod
    def build_options_buttons(intents: List[str]) -> List[Dict[str, str]]:
        """
        Converts intent codes into clickable UI buttons.
        """
        buttons = []
        for intent in intents:
            label = ClarificationArchitect.INTENT_BUTTON_MAPPING.get(intent, intent.title())
            buttons.append({
                "id": f"clarify_{intent}",
                "label": label,
                "type": "clarification_option"
            })
        
        # Always add a "Something else" option
        buttons.append({"id": "clarify_none", "label": "Something else... ", "type": "clarification_option"})
        return buttons

prompt_architect = PromptArchitect()
label_architect = LabelArchitect()
clarification_architect = ClarificationArchitect()

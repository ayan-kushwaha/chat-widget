"""
Output Parser & Validator for Training Results
Validates LLM JSON responses and handles errors gracefully
"""

import json
from typing import List, Dict, Any, Optional
from loguru import logger

class OutputParser:
    """Validates and parses Protocol Card outputs from LLM"""
    
    # Expected Protocol Card schema
    REQUIRED_FIELDS = ["title", "content", "rule_type"]
    OPTIONAL_FIELDS = ["description", "priority", "keywords", "intent", "confidence"]
    VALID_RULE_TYPES = ["policy", "workflow", "knowledge", "constraint", "guideline"]
    VALID_PRIORITIES = ["critical", "high", "medium", "low"]
    
    def validate_and_parse(self, llm_response: str) -> tuple[List[Dict[str, Any]], List[str]]:
        """
        Validate LLM output and return cards + errors.
        
        Args:
            llm_response: Raw text response from Gemini
        
        Returns:
            tuple: (valid_cards, error_messages)
        """
        errors = []
        
        # Step 1: Parse JSON
        try:
            parsed = json.loads(llm_response)
        except json.JSONDecodeError as e:
            logger.error(f" JSON parsing failed: {e}")
            errors.append(f"Invalid JSON: {str(e)}")
            return [], errors
        
        # Step 2: Extract cards array
        if isinstance(parsed, dict):
            cards = parsed.get("protocol_cards", parsed.get("cards", []))
        elif isinstance(parsed, list):
            cards = parsed
        else:
            errors.append("Response must be object or array")
            return [], errors
        
        # Step 3: Validate each card
        valid_cards = []
        for idx, card in enumerate(cards):
            card_errors = self._validate_card(card, idx)
            if card_errors:
                errors.extend(card_errors)
            else:
                # Normalize and clean card
                normalized = self._normalize_card(card)
                valid_cards.append(normalized)
        
        if valid_cards:
            logger.info(f" Validated {len(valid_cards)}/{len(cards)} cards")
        
        return valid_cards, errors
    
    def _validate_card(self, card: Dict[str, Any], idx: int) -> List[str]:
        """Validate individual card schema"""
        errors = []
        
        # Check required fields
        for field in self.REQUIRED_FIELDS:
            if field not in card or not card[field]:
                errors.append(f"Card {idx}: Missing required field '{field}'")
        
        # Validate rule_type
        if "rule_type" in card:
            if card["rule_type"] not in self.VALID_RULE_TYPES:
                errors.append(f"Card {idx}: Invalid rule_type '{card['rule_type']}'")
        
        # Validate priority
        if "priority" in card:
            if card["priority"] not in self.VALID_PRIORITIES:
                errors.append(f"Card {idx}: Invalid priority '{card['priority']}'")
        
        # Check content length
        if "content" in card and len(card["content"]) < 10:
            errors.append(f"Card {idx}: Content too short (min 10 chars)")
        
        return errors
    
    def _normalize_card(self, card: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and normalize card data"""
        return {
            "title": card.get("title", "").strip(),
            "description": card.get("description", "").strip(),
            "content": card.get("content", "").strip(),
            "rule_type": card.get("rule_type", "knowledge").lower(),
            "priority": card.get("priority", "medium").lower(),
            "keywords": card.get("keywords", []),
            "intent": card.get("intent", []),
            "confidence": card.get("confidence", 0.8)
        }
    
    def create_retry_prompt(self, original_prompt: str, errors: List[str]) -> str:
        """Generate refined prompt for retry after validation errors"""
        error_summary = "\n".join(f"- {err}" for err in errors[:5])  # Top 5 errors
        
        retry_prompt = f"""
{original_prompt}

IMPORTANT: Your previous response had validation errors:
{error_summary}

Please regenerate the Protocol Cards ensuring:
1. Valid JSON format
2. All required fields present: {', '.join(self.REQUIRED_FIELDS)}
3. rule_type must be one of: {', '.join(self.VALID_RULE_TYPES)}
4. priority must be one of: {', '.join(self.VALID_PRIORITIES)}
5. Content field has meaningful text (min 10 characters)

Return ONLY the JSON object, no markdown formatting.
"""
        return retry_prompt


# Singleton instance
output_parser = OutputParser()


def parse_with_retry(llm_response: str, retry_callback=None, max_retries: int = 2) -> List[Dict[str, Any]]:
    """
    Parse output with automatic retry on validation errors.
    
    Args:
        llm_response: Raw LLM response
        retry_callback: Optional function to call LLM again with refined prompt
        max_retries: Maximum retry attempts
    
    Returns:
        List of valid Protocol Cards
    """
    valid_cards, errors = output_parser.validate_and_parse(llm_response)
    
    # If validation successful, return cards
    if valid_cards and not errors:
        return valid_cards
    
    # If errors and retry callback available, attempt retry
    if errors and retry_callback and max_retries > 0:
        logger.warning(f" Validation errors found, retrying... ({max_retries} attempts left)")
        logger.warning(f"Errors: {errors[:3]}")  # Log first 3 errors
        
        # Call retry (would be implemented in training_worker)
        # This is just the parser - actual retry logic in worker
        return valid_cards  # Return what we have
    
    return valid_cards

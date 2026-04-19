"""
PII Masking Utility
Detects and redacts sensitive information for security compliance.
"""
import re
from typing import Dict, List, Tuple

class PIIMasker:
    """
    Detects and masks Personally Identifiable Information.
    Supports: Indian phones, emails, credit cards, Aadhaar, PAN.
    """
    
    # Regex patterns
    PHONE_PATTERN = r'\b(\+91[\-\s]?)?[6-9]\d{9}\b'
    EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    CREDIT_CARD_PATTERN = r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b'
    AADHAAR_PATTERN = r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b'
    PAN_PATTERN = r'\b[A-Z]{5}\d{4}[A-Z]\b'
    
    @staticmethod
    def mask_text(text: str, mask_char: str = "*") -> Tuple[str, Dict[str, int]]:
        """
        Masks all PII in text.
        Returns: (masked_text, detection_stats)
        """
        stats = {
            "phones": 0,
            "emails": 0,
            "credit_cards": 0,
            "aadhaar": 0,
            "pan": 0
        }
        
        masked = text
        
        # Mask phones (keep last 4 digits)
        def mask_phone(match):
            stats["phones"] += 1
            phone = match.group(0)
            if len(phone) >= 10:
                return mask_char * (len(phone) - 4) + phone[-4:]
            return mask_char * len(phone)
        
        masked = re.sub(PIIMasker.PHONE_PATTERN, mask_phone, masked)
        
        # Mask emails (keep domain)
        def mask_email(match):
            stats["emails"] += 1
            email = match.group(0)
            parts = email.split('@')
            if len(parts) == 2:
                username = parts[0]
                masked_username = username[0] + mask_char * (len(username) - 1) if len(username) > 1 else mask_char
                return f"{masked_username}@{parts[1]}"
            return mask_char * len(email)
        
        masked = re.sub(PIIMasker.EMAIL_PATTERN, mask_email, masked)
        
        # Mask credit cards (keep last 4)
        def mask_cc(match):
            stats["credit_cards"] += 1
            cc = match.group(0).replace(' ', '').replace('-', '')
            return mask_char * (len(cc) - 4) + cc[-4:]
        
        masked = re.sub(PIIMasker.CREDIT_CARD_PATTERN, mask_cc, masked)
        
        # Mask Aadhaar (keep last 4)
        def mask_aadhaar(match):
            # Only count if it's actually 12 digits (distinguish from credit cards)
            aadhaar = match.group(0).replace(' ', '').replace('-', '')
            if len(aadhaar) == 12:
                stats["aadhaar"] += 1
                return mask_char * 8 + aadhaar[-4:]
            return match.group(0)  # Not an Aadhaar, leave it
        
        masked = re.sub(PIIMasker.AADHAAR_PATTERN, mask_aadhaar, masked)
        
        # Mask PAN
        def mask_pan(match):
            stats["pan"] += 1
            pan = match.group(0)
            return pan[0] + mask_char * 8 + pan[-1]
        
        masked = re.sub(PIIMasker.PAN_PATTERN, mask_pan, masked)
        
        return masked, stats
    
    @staticmethod
    def tokenize_text(text: str) -> Tuple[str, Dict[str, str], Dict[str, int]]:
        """
        Replaces PII with non-destructive tokens (e.g., <PHONE_TOKEN_1>).
        Returns: (tokenized_text, token_vault, detection_stats)
        """
        stats = {
            "phones": 0, "emails": 0, "credit_cards": 0, "aadhaar": 0, "pan": 0
        }
        vault = {}
        tokenized = text
        
        def replace_with_token(match, pii_type: str, prefix: str) -> str:
            stats[pii_type] += 1
            token = f"<{prefix}_{stats[pii_type]}>"
            vault[token] = match.group(0)
            return token
            
        tokenized = re.sub(PIIMasker.PHONE_PATTERN, lambda m: replace_with_token(m, "phones", "PHONE_TOKEN"), tokenized)
        tokenized = re.sub(PIIMasker.EMAIL_PATTERN, lambda m: replace_with_token(m, "emails", "EMAIL_TOKEN"), tokenized)
        tokenized = re.sub(PIIMasker.CREDIT_CARD_PATTERN, lambda m: replace_with_token(m, "credit_cards", "CC_TOKEN"), tokenized)
        
        def tokenize_aadhaar(match):
            aadhaar = match.group(0).replace(' ', '').replace('-', '')
            if len(aadhaar) == 12:
                return replace_with_token(match, "aadhaar", "AADHAAR_TOKEN")
            return match.group(0)
            
        tokenized = re.sub(PIIMasker.AADHAAR_PATTERN, tokenize_aadhaar, tokenized)
        tokenized = re.sub(PIIMasker.PAN_PATTERN, lambda m: replace_with_token(m, "pan", "PAN_TOKEN"), tokenized)
        
        return tokenized, vault, stats

    @staticmethod
    def detokenize_text(tokenized_text: str, vault: Dict[str, str]) -> str:
        """
        Replaces tokens back with original PII values using the vault.
        """
        result = tokenized_text
        for token, original_value in vault.items():
            result = result.replace(token, original_value)
        return result
    
    @staticmethod
    def detect_only(text: str) -> Dict[str, List[str]]:
        """
        Detect PII without masking (for logging/auditing).
        Returns: dict of detected PII types and values.
        """
        detected = {
            "phones": [],
            "emails": [],
            "credit_cards": [],
            "aadhaar": [],
            "pan": []
        }
        
        detected["phones"] = re.findall(PIIMasker.PHONE_PATTERN, text)
        detected["emails"] = re.findall(PIIMasker.EMAIL_PATTERN, text)
        detected["credit_cards"] = re.findall(PIIMasker.CREDIT_CARD_PATTERN, text)
        detected["aadhaar"] = re.findall(PIIMasker.AADHAAR_PATTERN, text)
        detected["pan"] = re.findall(PIIMasker.PAN_PATTERN, text)
        
        return detected
    
    @staticmethod
    def has_pii(text: str) -> bool:
        """Quick check if text contains any PII."""
        patterns = [
            PIIMasker.PHONE_PATTERN,
            PIIMasker.EMAIL_PATTERN,
            PIIMasker.CREDIT_CARD_PATTERN,
            PIIMasker.AADHAAR_PATTERN,
            PIIMasker.PAN_PATTERN
        ]
        
        for pattern in patterns:
            if re.search(pattern, text):
                return True
        return False

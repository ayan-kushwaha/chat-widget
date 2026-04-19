"""
🧪 test_pii_shield.py — PIIShield Dual-Layer Validation
=========================================================
CTO Directive: Verify SpaCy + Regex PII masking works BEFORE Priority 2.

Test 1: Input scan correctly flags Indian phone, email, Aadhaar, UPI
Test 2: Output mask correctly replaces all PII tokens in a dict response
Test 3: Risk level classification (HIGH for Aadhaar/PAN, LOW for email/phone)
Test 4: Clean message (no PII) → pii_found = False
Test 5: Nested dict output → recursive masking works
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.services.aiskills.contracts.shared.pii_shield import PIIShield


# ── Fixtures ──────────────────────────────────────────────────────────────────

DIRTY_INPUT = (
    "Hi, mera naam Rahul Sharma hai. "
    "Mera phone number 9876543210 hai aur email rahul.sharma@gmail.com. "
    "Mera Aadhaar 2345 6789 0123 hai aur UPI hai rahul@paytm."
)

DIRTY_OUTPUT_DICT = {
    "customer_name":    "Rahul Sharma",
    "phone_number":     "9876543210",
    "customer_email":   "rahul.sharma@gmail.com",
    "delivery_address": "42, MG Road, Bangalore 560001",
    "order_id":         "ORD-2024-001",        # Not PII — should NOT be masked
    "aadhaar":          "2345 6789 0123",
    "payment_method":   "UPI: rahul@paytm",
    "nested": {
        "alt_phone":    "8765432109",
        "pan_card":     "ABCDE1234F",
    }
}

CLEAN_INPUT = "Mera order status kya hai? Order ID ORD-2024-001 ke liye batao."


# ── Test 1: Input scan detects all PII types ──────────────────────────────────

def test_scan_input_detects_phone():
    result = PIIShield.scan_input(DIRTY_INPUT)
    pii_types = [e["type"] for e in result["pii_entities"]]
    assert result["pii_found"] is True, "pii_found should be True for dirty input"
    assert "PHONE_IN" in pii_types, f"Phone not detected. Found: {pii_types}"
    print(f"✅ Phone detected | entities: {pii_types}")


def test_scan_input_detects_email():
    result = PIIShield.scan_input(DIRTY_INPUT)
    pii_types = [e["type"] for e in result["pii_entities"]]
    assert "EMAIL" in pii_types, f"Email not detected. Found: {pii_types}"
    print(f"✅ Email detected")


def test_scan_input_detects_aadhaar():
    result = PIIShield.scan_input(DIRTY_INPUT)
    pii_types = [e["type"] for e in result["pii_entities"]]
    assert "AADHAAR" in pii_types, f"Aadhaar not detected. Found: {pii_types}"
    print(f"✅ Aadhaar detected")


def test_scan_input_detects_upi():
    result = PIIShield.scan_input(DIRTY_INPUT)
    pii_types = [e["type"] for e in result["pii_entities"]]
    assert "UPI" in pii_types, f"UPI not detected. Found: {pii_types}"
    print(f"✅ UPI detected")


# ── Test 2: Risk level classification ─────────────────────────────────────────

def test_risk_level_high_for_aadhaar():
    """Aadhaar is a high-risk PII — must return HIGH."""
    result = PIIShield.scan_input(DIRTY_INPUT)
    assert result["risk_level"] == "HIGH", \
        f"Expected HIGH risk (Aadhaar present), got: {result['risk_level']}"
    print(f"✅ Risk level HIGH correctly set for Aadhaar input")


def test_risk_level_low_for_email_only():
    """Only email — should be LOW risk."""
    email_only = "Contact me at test@example.com for more info."
    result = PIIShield.scan_input(email_only)
    assert result["pii_found"] is True
    assert result["risk_level"] == "LOW", \
        f"Expected LOW risk (only email), got: {result['risk_level']}"
    print(f"✅ Risk level LOW correctly set for email-only input")


def test_clean_input_no_pii():
    """Clean message with no PII → pii_found must be False."""
    result = PIIShield.scan_input(CLEAN_INPUT)
    assert result["pii_found"] is False, \
        f"Expected pii_found=False for clean input, got: {result}"
    assert result["risk_level"] == "NONE"
    print(f"✅ Clean input correctly returns pii_found=False, risk=NONE")


# ── Test 3: Output masking — flat dict ────────────────────────────────────────

def test_mask_output_phone_field():
    """phone_number field explicitly in pii_fields → becomes [MASKED]."""
    masked = PIIShield.mask_output(
        DIRTY_OUTPUT_DICT,
        skill_pii_fields=["phone_number", "customer_email", "aadhaar", "payment_method"]
    )
    assert masked["phone_number"] == "[MASKED]", \
        f"phone_number not masked: {masked['phone_number']}"
    print(f"✅ phone_number field masked via pii_fields")


def test_mask_output_email_field():
    masked = PIIShield.mask_output(
        DIRTY_OUTPUT_DICT,
        skill_pii_fields=["phone_number", "customer_email", "aadhaar", "payment_method"]
    )
    assert masked["customer_email"] == "[MASKED]", \
        f"customer_email not masked: {masked['customer_email']}"
    print(f"✅ customer_email field masked via pii_fields")


def test_mask_output_non_pii_field_unchanged():
    """order_id is NOT a PII field — must survive the masking pass unchanged."""
    masked = PIIShield.mask_output(
        DIRTY_OUTPUT_DICT,
        skill_pii_fields=["phone_number", "customer_email"]
    )
    assert masked["order_id"] == "ORD-2024-001", \
        f"order_id should not be masked, got: {masked['order_id']}"
    print(f"✅ order_id (non-PII) preserved correctly")


# ── Test 4: Nested dict recursive masking ─────────────────────────────────────

def test_mask_output_nested_phone():
    """Nested alt_phone with PHONE_IN regex match → should be masked by _mask_string."""
    masked = PIIShield.mask_output(DIRTY_OUTPUT_DICT, skill_pii_fields=[])
    nested_phone = masked["nested"]["alt_phone"]
    # Regex should have replaced the 10-digit Indian phone
    assert "8765432109" not in nested_phone, \
        f"Nested phone number was NOT masked: {nested_phone}"
    print(f"✅ Nested phone masked via regex: '{nested_phone}'")


def test_mask_output_nested_pan():
    """Nested PAN card → should be masked by regex."""
    masked = PIIShield.mask_output(DIRTY_OUTPUT_DICT, skill_pii_fields=[])
    nested_pan = masked["nested"]["pan_card"]
    assert "ABCDE1234F" not in nested_pan, \
        f"Nested PAN was NOT masked: {nested_pan}"
    print(f"✅ Nested PAN masked via regex: '{nested_pan}'")


# ── Test 5: String masking ────────────────────────────────────────────────────

def test_mask_string_aadhaar():
    result = PIIShield.mask_output("Aadhaar: 2345 6789 0123 hai.")
    assert "2345 6789 0123" not in result, f"Aadhaar not masked in string: {result}"
    assert "[AADHAAR_MASKED]" in result
    print(f"✅ String Aadhaar masking: '{result}'")


def test_mask_string_email():
    result = PIIShield.mask_output("Email karo mujhe: boss@company.in")
    assert "boss@company.in" not in result, f"Email not masked: {result}"
    assert "[EMAIL_MASKED]" in result
    print(f"✅ String email masking: '{result}'")


# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

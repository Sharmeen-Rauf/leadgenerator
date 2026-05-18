"""
Phone Validator — 100% free, offline, no API key.
Uses Google's libphonenumber for validation and carrier detection.
"""

import phonenumbers
from phonenumbers import geocoder, carrier
from typing import Dict


def validate_and_enrich_phone(
    raw_phone: str,
    default_country: str = "US"
) -> Dict:
    """
    Full phone validation + enrichment using Google's libphonenumber.
    No API key, no rate limits, completely offline.
    """
    try:
        parsed = phonenumbers.parse(raw_phone, default_country)

        is_valid = phonenumbers.is_valid_number(parsed)

        # Format in multiple ways
        e164 = phonenumbers.format_number(
            parsed, phonenumbers.PhoneNumberFormat.E164
        )
        national = phonenumbers.format_number(
            parsed, phonenumbers.PhoneNumberFormat.NATIONAL
        )
        international = phonenumbers.format_number(
            parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL
        )

        # Carrier info
        carrier_name = carrier.name_for_number(parsed, "en")

        # Location
        location = geocoder.description_for_number(parsed, "en")

        # Number type
        num_type = phonenumbers.number_type(parsed)
        type_map = {
            0: "fixed_line",
            1: "mobile",
            2: "fixed_or_mobile",
            3: "toll_free",
            4: "premium_rate",
            6: "voip",
            7: "personal",
        }
        number_type = type_map.get(num_type, "unknown")

        return {
            "raw": raw_phone,
            "e164": e164,
            "national": national,
            "international": international,
            "valid": is_valid,
            "country_code": parsed.country_code,
            "country": phonenumbers.region_code_for_number(parsed),
            "carrier": carrier_name or None,
            "location": location,
            "type": number_type,
            "is_mobile": number_type == "mobile",
            "is_landline": number_type == "fixed_line",
            "is_voip": number_type == "voip",
        }

    except phonenumbers.NumberParseException as e:
        return {
            "raw": raw_phone,
            "valid": False,
            "error": str(e),
        }

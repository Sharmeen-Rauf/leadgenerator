"""
Lead Scoring Engine — AI-powered 0-100 scoring.
Scores each lead based on how much they need your services.
Higher score = more opportunity = easier sale.
"""

from typing import Dict, List


def score_lead(
    business: Dict,
    website_data: Dict,
    your_service: str = "digital_marketing"
) -> Dict:
    """
    Score a lead 0-100 based on how much they need your services.
    Higher score = more opportunity = easier sale.
    """
    score = 0
    reasons = []
    opportunities = []

    # === WEBSITE SIGNALS ===
    if not website_data.get("exists"):
        score += 35
        reasons.append("No website (CRITICAL gap)")
        opportunities.append("web_design")

    elif website_data.get("cms") in ["Wix", "Squarespace", "GoDaddy"]:
        score += 20
        reasons.append(f"Amateur platform ({website_data.get('cms')})")
        opportunities.append("web_redesign")

    elif website_data.get("load_time_ms", 0) > 4000:
        score += 15
        reasons.append("Slow website (>4s load time)")
        opportunities.append("web_performance")

    # === REPUTATION SIGNALS ===
    rating = business.get("rating") or 5.0
    reviews = business.get("reviews") or 0

    if rating < 3.5:
        score += 20
        reasons.append(f"Poor rating ({rating} stars)")
        opportunities.append("reputation_management")
    elif rating < 4.0:
        score += 12
        reasons.append(f"Below-average rating ({rating} stars)")
        opportunities.append("reputation_management")

    if reviews < 10:
        score += 10
        reasons.append(f"Only {reviews} reviews — invisible locally")
        opportunities.append("local_seo")
    elif reviews < 30:
        score += 5
        reasons.append(f"Low review count ({reviews})")

    # === DIGITAL MARKETING SIGNALS ===
    seo_score = website_data.get("seo", {}).get("seo_score", 0)
    if seo_score < 40:
        score += 15
        reasons.append(f"Poor SEO ({seo_score}/100)")
        opportunities.append("seo")

    if not website_data.get("tracking_pixels"):
        score += 10
        reasons.append("No ad tracking pixels installed")
        opportunities.append("paid_ads")

    if not website_data.get("analytics"):
        score += 8
        reasons.append("No Google Analytics")
        opportunities.append("analytics")

    # === SOCIAL SIGNALS ===
    social = website_data.get("social_links", {})
    if not social.get("instagram"):
        score += 8
        reasons.append("No Instagram presence")
        opportunities.append("social_media")

    if not social.get("facebook"):
        score += 5
        reasons.append("No Facebook page")
        opportunities.append("facebook_ads")

    # === CLASSIFICATION ===
    score = min(score, 99)

    if score >= 70:
        classification = "HOT"
        color = "#22c55e"
    elif score >= 40:
        classification = "WARM"
        color = "#f59e0b"
    else:
        classification = "COLD"
        color = "#ef4444"

    return {
        "score": score,
        "classification": classification,
        "color": color,
        "reasons": reasons,
        "opportunities": list(set(opportunities)),
        "top_opportunity": opportunities[0] if opportunities else None,
        "estimated_deal_value": _estimate_deal_value(opportunities),
    }


def _estimate_deal_value(opportunities: List[str]) -> str:
    """Rough estimate of potential deal value."""
    pricing = {
        "web_design": "$1,500 - $5,000",
        "web_redesign": "$2,000 - $8,000",
        "seo": "$500 - $2,000/mo",
        "paid_ads": "$500 - $3,000/mo",
        "social_media": "$800 - $2,500/mo",
        "reputation_management": "$300 - $1,000/mo",
        "local_seo": "$400 - $1,500/mo",
        "analytics": "$200 - $500",
    }
    if not opportunities:
        return "$500 - $1,000"
    return pricing.get(opportunities[0], "$500 - $2,000")

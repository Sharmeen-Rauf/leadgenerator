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
    Score a lead 0-100 based on the Master AI Opportunity Engine model.
    Higher score = more opportunity = easier sale.
    """
    exists = website_data.get("exists", False)
    ssl = website_data.get("ssl", False)
    load_time = website_data.get("load_time_ms") or 8000
    cms = website_data.get("cms")
    seo_data = website_data.get("seo", {})
    seo_score = seo_data.get("seo_score", 0)

    social_count = len(website_data.get("social_links", {}))
    analytics_count = len(website_data.get("analytics", []))
    pixel_count = len(website_data.get("tracking_pixels", []))

    # --- CATEGORY SCORE COMPUTATION ---
    website_cat = min(int((20 if exists else 0) + (15 if ssl else 0) + (25 if load_time < 3000 else 15 if load_time < 5000 else 5) + (20 if cms not in [None, "Custom/Unknown", "Wix", "GoDaddy"] else 10) + 20), 100) if exists else 0
    seo_cat = min(seo_score, 100)
    social_cat = min(social_count * 17, 100)
    ads_cat = min((30 if analytics_count > 0 else 0) + (40 if pixel_count > 0 else 0) + 30, 100) if exists else 0
    aeo_cat = min(seo_score, 100)
    conversion_cat = min((15 if exists else 0) + (15 if exists and cms not in ["Wix", "GoDaddy"] else 0) + 70, 100) if exists else 0

    # --- GAP GAPS (100 - category_score) ---
    website_gap = 100 - website_cat
    seo_gap = 100 - seo_cat
    conv_gap = 100 - conversion_cat
    social_gap = 100 - social_cat
    ads_gap = 100 - ads_cat
    aeo_gap = 100 - aeo_cat

    # --- LOCAL SEO ---
    rating = business.get("rating") or 0.0
    reviews = business.get("reviews") or 0
    local_seo_gap = 0
    if rating < 3.5 and rating > 0:
        local_seo_gap = 90
    elif rating < 4.0 and rating > 0:
        local_seo_gap = 60
    elif rating < 4.5:
        local_seo_gap = 30
    if reviews < 10:
        local_seo_gap = max(local_seo_gap, 70)
    elif reviews < 30:
        local_seo_gap = max(local_seo_gap, 40)

    # --- BUYING INTENT ---
    buying_intent = 0
    if not exists:
        buying_intent = 90
    else:
        if cms in ["Wix", "GoDaddy"]:
            buying_intent += 30
        if load_time > 5000:
            buying_intent += 20
        if rating > 0 and rating < 3.5:
            buying_intent += 25
        if reviews > 50 and rating >= 4.0 and website_gap > 50:
            buying_intent += 25
    buying_intent = min(buying_intent, 100)

    # --- WEIGHTS ENGINE ---
    weights = {
        "website": 20,
        "seo": 20,
        "localSeo": 15,
        "ads": 10,
        "social": 10,
        "conversion": 10,
        "intent": 10,
        "aeo": 5,
    }
    raw = (
        weights["website"] * website_gap
        + weights["seo"] * seo_gap
        + weights["localSeo"] * local_seo_gap
        + weights["ads"] * ads_gap
        + weights["social"] * social_gap
        + weights["conversion"] * conv_gap
        + weights["intent"] * buying_intent
        + weights["aeo"] * aeo_gap
    ) / 100
    score = min(round(raw), 99)

    # --- REVENUE LOSS ESTIMATION ---
    revenue_multiplier = {
        "roofing": 8000,
        "dental": 5000,
        "dentist": 5000,
        "lawyer": 12000,
        "restaurant": 3000,
        "plumbing": 4000,
        "hvac": 6000,
        "real estate": 7000,
        "gym": 3000,
        "default": 4000,
    }
    
    # Check niche mapping
    avg_job_value = revenue_multiplier["default"]
    niche_lower = your_service.lower()
    for k, v in revenue_multiplier.items():
        if k in niche_lower:
            avg_job_value = v
            break

    lost_leads_per_month = round(
        (website_gap / 100) * 15
        + (seo_gap / 100) * 10
        + (conv_gap / 100) * 8
    )
    estimated_monthly_loss = round(lost_leads_per_month * avg_job_value * 0.1)
    estimated_deal_value = f"${round(estimated_monthly_loss * 3):,} - ${round(estimated_monthly_loss * 6):,}/yr"

    classification = "HOT" if score >= 70 else "WARM" if score >= 40 else "COLD"
    color = "#22c55e" if score >= 70 else "#f59e0b" if score >= 40 else "#ef4444"

    return {
        "score": score,
        "classification": classification,
        "color": color,
        "breakdown": {
            "website": {"score": website_gap, "weight": weights["website"], "label": "Website Issues"},
            "seo": {"score": seo_gap, "weight": weights["seo"], "label": "SEO Weakness"},
            "localSeo": {"score": local_seo_gap, "weight": weights["localSeo"], "label": "Local SEO"},
            "ads": {"score": ads_gap, "weight": weights["ads"], "label": "Ads Opportunity"},
            "social": {"score": social_gap, "weight": weights["social"], "label": "Social Gaps"},
            "conversion": {"score": conv_gap, "weight": weights["conversion"], "label": "Conversion Issues"},
            "buyingIntent": {"score": buying_intent, "weight": weights["intent"], "label": "Buying Intent"},
            "aeo": {"score": aeo_gap, "weight": weights["aeo"], "label": "AI Search Readiness"},
        },
        "revenue": {
            "lostLeadsPerMonth": lost_leads_per_month,
            "estimatedMonthlyLoss": estimated_monthly_loss,
            "avgJobValue": avg_job_value,
            "topService": "Web Redesign" if website_gap > seo_gap else "SEO",
            "estimatedDealValue": estimated_deal_value,
        },
    }

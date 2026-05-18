"""
Website Intelligence Analyzer — 100% free, no API needed.
Detects CMS, analytics, tracking pixels, social links, SEO quality.
"""

import httpx
import time
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import Dict, List, Optional


async def analyze_website(url: str) -> Dict:
    """
    Full website intelligence report.
    Detects: CMS, analytics, tracking pixels, social media,
    SEO quality, load time, SSL, frameworks.
    """
    if not url:
        return {"exists": False, "score": 0, "opportunities": []}

    if not url.startswith("http"):
        url = f"https://{url}"

    result = {
        "url": url,
        "exists": False,
        "ssl": False,
        "load_time_ms": None,
        "cms": None,
        "frameworks": [],
        "analytics": [],
        "tracking_pixels": [],
        "social_links": {},
        "emails": [],
        "phones": [],
        "seo": {},
        "opportunities": [],
        "score": 0,
        "server": None,
    }

    try:
        start = time.time()

        async with httpx.AsyncClient(
            timeout=15,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                "Accept": "text/html,application/xhtml+xml",
            },
        ) as client:
            r = await client.get(url)
            load_time = int((time.time() - start) * 1000)

        result["exists"] = True
        result["ssl"] = url.startswith("https")
        result["load_time_ms"] = load_time
        result["server"] = r.headers.get("server", "").split("/")[0]

        html = r.text
        soup = BeautifulSoup(html, "html.parser")

        result["cms"] = _detect_cms(html, r.headers)
        result["analytics"] = _detect_analytics(html)
        result["tracking_pixels"] = _detect_pixels(html)
        result["frameworks"] = _detect_frameworks(html)
        result["social_links"] = _extract_social_links(soup)
        result["seo"] = _analyze_seo(soup, html)
        result["emails"] = _extract_emails(html)
        result["phones"] = _extract_phones(html)
        result["score"] = _calculate_score(result, load_time)
        result["opportunities"] = _identify_opportunities(result)

    except httpx.ConnectError:
        result["exists"] = False
        result["opportunities"] = [
            {"service": "Web Design", "priority": "CRITICAL",
             "reason": "Website is down or unreachable"}
        ]
    except Exception as e:
        result["error"] = str(e)

    return result


def _detect_cms(html: str, headers) -> Optional[str]:
    """Detect what CMS/platform powers the website."""
    checks = [
        ("WordPress", ["wp-content", "wp-includes", "wordpress"]),
        ("Shopify", ["shopify.com", "cdn.shopify", "Shopify.shop"]),
        ("Wix", ["wix.com", "wixsite.com", "_wixCIDX"]),
        ("Squarespace", ["squarespace.com", "static.squarespace"]),
        ("Webflow", ["webflow.com", "webflow.io"]),
        ("Joomla", ["joomla", "/components/com_"]),
        ("Drupal", ["drupal.org", "Drupal.settings"]),
        ("Ghost", ["ghost.io", "ghost-theme"]),
        ("WooCommerce", ["woocommerce", "wc-api"]),
        ("BigCommerce", ["bigcommerce.com"]),
        ("GoDaddy", ["godaddy.com", "godaddysites.com"]),
    ]
    html_lower = html.lower()
    for cms_name, signals in checks:
        if any(s.lower() in html_lower for s in signals):
            return cms_name

    powered = headers.get("x-powered-by", "")
    if powered:
        return powered.split("/")[0]

    return "Custom/Unknown"


def _detect_analytics(html: str) -> List[str]:
    detected = []
    if "gtag(" in html or "google-analytics.com" in html:
        detected.append("Google Analytics")
    if "googletagmanager.com" in html:
        detected.append("Google Tag Manager")
    if "hotjar.com" in html:
        detected.append("Hotjar")
    if "mixpanel.com" in html:
        detected.append("Mixpanel")
    if "clarity.ms" in html:
        detected.append("Microsoft Clarity")
    if "heap.io" in html:
        detected.append("Heap")
    return detected


def _detect_pixels(html: str) -> List[str]:
    detected = []
    if "fbq(" in html or "facebook.net/en_US/fbevents" in html:
        detected.append("Facebook Pixel")
    if "snap.licdn.com" in html or "linkedin.com/px" in html:
        detected.append("LinkedIn Pixel")
    if "tiktok.com/i18n/pixel" in html or "ttq.track" in html:
        detected.append("TikTok Pixel")
    if "googleadservices.com" in html or "AW-" in html:
        detected.append("Google Ads Conversion")
    return detected


def _detect_frameworks(html: str) -> List[str]:
    frameworks = []
    html_lower = html.lower()
    if "__reactFiber" in html or "react-root" in html or "_next/static" in html:
        frameworks.append("React")
    if "__vue__" in html or "v-app" in html:
        frameworks.append("Vue.js")
    if "ng-version" in html:
        frameworks.append("Angular")
    if "jquery" in html_lower:
        frameworks.append("jQuery")
    if "bootstrap" in html_lower:
        frameworks.append("Bootstrap")
    if "tailwind" in html_lower:
        frameworks.append("Tailwind CSS")
    return frameworks


def _extract_social_links(soup) -> Dict:
    socials = {}
    patterns = {
        "facebook": r"facebook\.com/(?!sharer|share|plugins|login)([^/?&\"'\s]+)",
        "instagram": r"instagram\.com/([^/?&\"'\s]+)",
        "twitter": r"(?:twitter|x)\.com/([^/?&\"'\s]+)",
        "linkedin": r"linkedin\.com/(?:company|in)/([^/?&\"'\s]+)",
        "youtube": r"youtube\.com/(?:channel|c|user|@)([^/?&\"'\s]+)",
        "tiktok": r"tiktok\.com/@([^/?&\"'\s]+)",
    }
    all_links = " ".join(a.get("href", "") for a in soup.find_all("a", href=True))
    for platform, pattern in patterns.items():
        match = re.search(pattern, all_links, re.IGNORECASE)
        if match:
            socials[platform] = match.group(0)
    return socials


def _analyze_seo(soup, html: str) -> Dict:
    title = soup.find("title")
    meta_desc = soup.find("meta", {"name": "description"})
    h1_tags = soup.find_all("h1")
    og_tags = bool(soup.find("meta", property=re.compile(r"^og:")))
    schema = "application/ld+json" in html

    title_text = title.get_text().strip() if title else None
    desc_text = meta_desc.get("content", "").strip() if meta_desc else None

    seo_score = sum([
        20 if title_text and 30 < len(title_text) < 65 else 0,
        20 if desc_text and 100 < len(desc_text) < 160 else 0,
        20 if h1_tags else 0,
        20 if og_tags else 0,
        20 if schema else 0,
    ])

    return {
        "title": title_text,
        "title_length": len(title_text) if title_text else 0,
        "meta_description": desc_text,
        "meta_desc_length": len(desc_text) if desc_text else 0,
        "h1_count": len(h1_tags),
        "h1_text": h1_tags[0].get_text().strip() if h1_tags else None,
        "has_og_tags": og_tags,
        "has_schema_markup": schema,
        "seo_score": seo_score,
    }


def _extract_emails(html: str) -> List[str]:
    pattern = r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    found = re.findall(pattern, html)
    filtered = [
        e for e in found
        if not any(bad in e for bad in [
            ".png", ".jpg", ".svg", ".css", ".js", "example", "sentry"
        ])
    ]
    return list(set(filtered))[:5]


def _extract_phones(html: str) -> List[str]:
    patterns = [
        r"\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4}",
        r"\+1[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}",
    ]
    phones = []
    for p in patterns:
        phones.extend(re.findall(p, html))
    return list(set(phones))[:3]


def _calculate_score(data: Dict, load_time: int) -> int:
    score = 0
    if data.get("exists"):
        score += 20
    if data.get("ssl"):
        score += 15
    if load_time < 3000:
        score += 15
    elif load_time < 5000:
        score += 8
    if data.get("seo", {}).get("seo_score", 0) > 40:
        score += 15
    if data.get("analytics"):
        score += 10
    if data.get("tracking_pixels"):
        score += 10
    if data.get("social_links"):
        score += 10
    if data.get("cms") not in [None, "Custom/Unknown", "Wix", "GoDaddy"]:
        score += 5
    return min(score, 100)


def _identify_opportunities(data: Dict) -> List[Dict]:
    """Identify what services to pitch based on website weaknesses."""
    opps = []

    if not data.get("exists"):
        opps.append({
            "service": "Web Design", "priority": "CRITICAL",
            "reason": "No website found — biggest opportunity"
        })
        return opps

    if data.get("cms") in ["Wix", "GoDaddy", "Squarespace"]:
        opps.append({
            "service": "Web Redesign", "priority": "HIGH",
            "reason": f"Using {data['cms']} — amateur platform"
        })

    if data.get("load_time_ms", 0) > 4000:
        opps.append({
            "service": "Web Performance", "priority": "HIGH",
            "reason": f"Slow site ({data['load_time_ms']}ms)"
        })

    if not data.get("tracking_pixels"):
        opps.append({
            "service": "Paid Ads Setup", "priority": "HIGH",
            "reason": "No tracking pixels — can't run retargeting"
        })

    if not data.get("analytics"):
        opps.append({
            "service": "Analytics Setup", "priority": "MEDIUM",
            "reason": "Not tracking visitors"
        })

    if data.get("seo", {}).get("seo_score", 0) < 40:
        opps.append({
            "service": "SEO", "priority": "HIGH",
            "reason": f"SEO score {data['seo'].get('seo_score', 0)}/100"
        })

    social = data.get("social_links", {})
    if not social.get("instagram"):
        opps.append({
            "service": "Social Media", "priority": "MEDIUM",
            "reason": "No Instagram presence"
        })
    if not social.get("facebook"):
        opps.append({
            "service": "Facebook Marketing", "priority": "MEDIUM",
            "reason": "No Facebook page"
        })

    return opps

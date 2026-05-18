"""
Email Finder — 100% free, no paid API needed.
Crawls websites for public emails, generates patterns, verifies via SMTP.
"""

import re
import asyncio
import smtplib
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse

# Regex for matching email addresses
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# False positive patterns to filter out
EMAIL_BLACKLIST_PARTS = [
    ".png", ".jpg", ".gif", ".svg", ".css", ".js",
    "example.com", "youremail", "sentry.io", "wixpress",
    "@2x", "noreply", "no-reply", "test@", "user@",
]

# Generic business email prefixes
GENERIC_PREFIXES = [
    "info", "contact", "sales", "support", "admin",
    "hello", "office", "enquiries", "team", "hi",
]


async def find_emails_for_business(
    business_name: str,
    website: Optional[str],
    domain: Optional[str] = None
) -> Dict:
    """
    Full email finding pipeline — no paid APIs needed.
    1. Scrape website for visible emails
    2. Check Contact/About pages
    3. Generate generic email patterns + SMTP verify
    """
    result = {
        "emails_found": [],
        "verified_emails": [],
        "personal_email": None,
        "generic_email": None,
        "decision_maker_name": None,
        "confidence": 0,
        "method": None,
    }

    # Determine domain
    if not domain and website:
        parsed = urlparse(website if website.startswith("http") else f"https://{website}")
        domain = parsed.netloc.replace("www.", "")

    if not domain:
        return result

    # Step 1: Scrape website for visible emails
    scraped = await _scrape_emails_from_website(
        website or f"https://{domain}"
    )
    if scraped:
        result["emails_found"].extend(scraped)
        result["method"] = "website_scrape"
        result["confidence"] = 85

    all_emails = list(set(result["emails_found"]))

    # Step 2: If no emails found, generate generic patterns
    if not all_emails:
        generic_emails = [f"{prefix}@{domain}" for prefix in GENERIC_PREFIXES[:4]]
        all_emails = generic_emails
        result["method"] = "pattern_generation"
        result["confidence"] = 50

    # Step 3: Classify emails (personal vs generic)
    for email in all_emails:
        prefix = email.split("@")[0].lower()
        if prefix not in GENERIC_PREFIXES:
            result["personal_email"] = email
            # Infer decision maker name from email prefix
            name = prefix.replace(".", " ").replace("_", " ").replace("-", " ")
            result["decision_maker_name"] = name.title()
        else:
            if not result["generic_email"]:
                result["generic_email"] = email

    # Step 4: SMTP verification (try top 5 only)
    verified = []
    for email in all_emails[:5]:
        try:
            is_valid = await _verify_email_smtp(email)
            if is_valid:
                verified.append(email)
        except Exception:
            pass

    result["verified_emails"] = verified
    if verified:
        result["confidence"] = 95
        result["method"] = "smtp_verified"

    result["emails_found"] = all_emails
    return result


async def _scrape_emails_from_website(url: str) -> List[str]:
    """Crawl website pages to find exposed email addresses."""
    if not url.startswith("http"):
        url = f"https://{url}"

    emails = set()
    pages_to_check = [url]
    visited = set()

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    }

    async with httpx.AsyncClient(
        timeout=10, follow_redirects=True, headers=headers
    ) as client:

        # Find contact/about pages from homepage
        try:
            r = await client.get(url)
            soup = BeautifulSoup(r.text, "html.parser")

            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"].lower()
                if any(word in href for word in ["contact", "about", "team", "reach", "staff"]):
                    full_url = urljoin(url, a_tag["href"])
                    if full_url not in visited:
                        pages_to_check.append(full_url)
        except Exception:
            pass

        # Scrape each page for emails
        for page_url in pages_to_check[:5]:
            if page_url in visited:
                continue
            visited.add(page_url)

            try:
                r = await client.get(page_url, timeout=8)
                html = r.text

                # Regex search in raw HTML
                found = EMAIL_REGEX.findall(html)

                # mailto: links
                soup = BeautifulSoup(html, "html.parser")
                for a_tag in soup.find_all("a", href=re.compile(r"^mailto:")):
                    email = a_tag["href"].replace("mailto:", "").split("?")[0].strip()
                    if "@" in email:
                        found.append(email)

                # Filter and clean
                for email in found:
                    email = email.lower().strip()
                    if (
                        "@" in email
                        and not any(bad in email for bad in EMAIL_BLACKLIST_PARTS)
                        and len(email) < 100
                    ):
                        emails.add(email)

            except Exception:
                continue

    return list(emails)


async def _verify_email_smtp(email: str) -> bool:
    """
    Verify email exists via SMTP handshake — no email actually sent.
    Same technique used by Hunter.io and ZeroBounce.
    """
    try:
        import dns.resolver

        domain = email.split("@")[1]

        loop = asyncio.get_event_loop()
        mx_records = await loop.run_in_executor(
            None, lambda: dns.resolver.resolve(domain, "MX")
        )
        mx_host = str(
            sorted(mx_records, key=lambda x: x.preference)[0].exchange
        )

        def _smtp_check():
            try:
                with smtplib.SMTP(mx_host, 25, timeout=10) as smtp:
                    smtp.ehlo("gmail.com")
                    smtp.mail("verify@gmail.com")
                    code, _ = smtp.rcpt(email)
                    return code == 250
            except Exception:
                return False

        return await loop.run_in_executor(None, _smtp_check)

    except Exception:
        return False

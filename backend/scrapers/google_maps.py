"""
Google Maps Scraper — Playwright-based, 100% free, unlimited.
Scrapes business listings from Google Maps using headless Chromium.
"""

import asyncio
import random
from playwright.async_api import async_playwright
from typing import List, Dict, Optional

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]


async def scrape_google_maps(
    query: str,
    location: str,
    max_results: int = 50
) -> List[Dict]:
    """
    Scrape Google Maps listings — completely free, no API key needed.
    Handles scroll pagination, extracts full business details.
    """
    results = []
    search_query = f"{query} in {location}".replace(" ", "+")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                f"--user-agent={random.choice(USER_AGENTS)}"
            ]
        )

        context = await browser.new_context(
            viewport={"width": 1366, "height": 768},
            locale="en-US",
            timezone_id="America/New_York",
        )

        page = await context.new_page()

        # Navigate to Google Maps search
        url = f"https://www.google.com/maps/search/{search_query}"
        print(f"[GoogleMaps] Navigating to: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(random.uniform(3, 5))

        # Handle consent dialog if it appears
        try:
            consent_btn = await page.query_selector('button[aria-label*="Accept"]')
            if consent_btn:
                await consent_btn.click()
                await asyncio.sleep(1)
        except:
            pass

        # Scroll the results panel to load more listings
        results_panel = await page.query_selector('[role="feed"]')
        if results_panel:
            scroll_count = max(max_results // 8, 3)
            for i in range(scroll_count):
                await results_panel.evaluate("el => el.scrollTop += 2000")
                await asyncio.sleep(random.uniform(1.5, 3.0))
                print(f"[GoogleMaps] Scroll {i+1}/{scroll_count}")

        # Get all listing links
        listings = await page.query_selector_all(
            '[role="feed"] > div > div > a[href*="/maps/place/"]'
        )
        print(f"[GoogleMaps] Found {len(listings)} listing links")

        for i, listing in enumerate(listings[:max_results]):
            try:
                await listing.click()
                await page.wait_for_selector("h1.DUwDvf", timeout=5000)
                await asyncio.sleep(random.uniform(1.0, 2.0))

                biz = await _extract_business_details(page)
                if biz.get("name"):
                    results.append(biz)
                    print(f"[GoogleMaps] [{i+1}] Scraped: {biz['name']}")

            except Exception as e:
                print(f"[GoogleMaps] Error on listing {i}: {e}")
                continue

        await browser.close()

    print(f"[GoogleMaps] Total scraped: {len(results)}")
    return results


async def _extract_business_details(page) -> Dict:
    """Extract complete business information from Google Maps detail panel."""

    async def safe_text(selector: str) -> Optional[str]:
        try:
            el = await page.query_selector(selector)
            return (await el.inner_text()).strip() if el else None
        except:
            return None

    async def safe_attr(selector: str, attr: str) -> Optional[str]:
        try:
            el = await page.query_selector(selector)
            return await el.get_attribute(attr) if el else None
        except:
            return None

    # Core fields
    name = await safe_text("h1.DUwDvf")
    category = await safe_text("button.DkEaL")
    rating_raw = await safe_text("span.MW4etd")
    reviews_raw = await safe_text("span.UY7F9")
    address = await safe_text('button[data-item-id="address"] .Io6YTe')
    phone = await safe_text('button[data-item-id*="phone"] .Io6YTe')
    website = await safe_attr('a[data-item-id="authority"]', "href")

    # Extract coordinates from URL
    current_url = page.url
    coords = None
    if "@" in current_url:
        try:
            coord_part = current_url.split("@")[1].split(",")
            coords = {"lat": float(coord_part[0]), "lng": float(coord_part[1])}
        except:
            pass

    # Clean reviews count
    reviews_count = None
    if reviews_raw:
        reviews_count = int("".join(filter(str.isdigit, reviews_raw)))

    rating_clean = None
    if rating_raw:
        try:
            rating_clean = float(rating_raw.replace(",", "."))
        except:
            pass

    return {
        "name": name,
        "category": category,
        "rating": rating_clean,
        "reviews": reviews_count,
        "address": address,
        "phone": phone,
        "website": website,
        "coordinates": coords,
        "source": "google_maps",
    }

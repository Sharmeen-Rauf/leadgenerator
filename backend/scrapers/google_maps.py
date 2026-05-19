"""
Google Maps Scraper — Playwright-based, 100% free, unlimited.
Uses sync Playwright API in a thread pool to avoid Windows asyncio subprocess issues.
"""

import random
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from playwright.sync_api import sync_playwright
from typing import List, Dict, Optional

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

_executor = ThreadPoolExecutor(max_workers=2)


def _scrape_sync(query: str, location: str, max_results: int) -> List[Dict]:
    """
    Synchronous Playwright scraper that runs in a thread.
    Avoids Windows asyncio NotImplementedError with subprocesses.
    """
    results = []
    search_query = f"{query} in {location}".replace(" ", "+")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        )

        context = browser.new_context(
            viewport={"width": 1366, "height": 768},
            locale="en-US",
            timezone_id="America/New_York",
            user_agent=random.choice(USER_AGENTS),
        )

        page = context.new_page()

        url = f"https://www.google.com/maps/search/{search_query}"
        print(f"[GoogleMaps] Navigating to: {url}")
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(random.uniform(3, 5))

        # Handle consent dialog
        try:
            consent_btn = page.query_selector('button[aria-label*="Accept"]')
            if consent_btn:
                consent_btn.click()
                time.sleep(1)
        except Exception:
            pass

        # Scroll the results panel to load more
        results_panel = page.query_selector('[role="feed"]')
        if results_panel:
            scroll_count = max(max_results // 8, 3)
            for i in range(scroll_count):
                results_panel.evaluate("el => el.scrollTop += 2000")
                time.sleep(random.uniform(1.5, 2.5))
                print(f"[GoogleMaps] Scroll {i+1}/{scroll_count}")

        # Get all listing links
        listings = page.query_selector_all(
            '[role="feed"] > div > div > a[href*="/maps/place/"]'
        )
        print(f"[GoogleMaps] Found {len(listings)} listing links")

        for i, listing in enumerate(listings[:max_results]):
            try:
                listing.click()
                page.wait_for_selector("h1.DUwDvf", timeout=5000)
                time.sleep(random.uniform(0.8, 1.5))

                biz = _extract_details(page)
                if biz.get("name"):
                    results.append(biz)
                    print(f"[GoogleMaps] [{i+1}] {biz['name']}")

            except Exception as e:
                print(f"[GoogleMaps] Error on listing {i}: {e}")
                continue

        browser.close()

    print(f"[GoogleMaps] Total scraped: {len(results)}")
    return results


def _extract_details(page) -> Dict:
    """Extract business info from the detail panel."""

    def safe_text(selector: str) -> Optional[str]:
        try:
            el = page.query_selector(selector)
            return el.inner_text().strip() if el else None
        except Exception:
            return None

    def safe_attr(selector: str, attr: str) -> Optional[str]:
        try:
            el = page.query_selector(selector)
            return el.get_attribute(attr) if el else None
        except Exception:
            return None

    name = safe_text("h1.DUwDvf")
    category = safe_text("button.DkEaL")
    rating_raw = safe_text("span.MW4etd")
    reviews_raw = safe_text("span.UY7F9")
    address = safe_text('button[data-item-id="address"] .Io6YTe')
    phone = safe_text('button[data-item-id*="phone"] .Io6YTe')
    website = safe_attr('a[data-item-id="authority"]', "href")

    coords = None
    current_url = page.url
    if "@" in current_url:
        try:
            parts = current_url.split("@")[1].split(",")
            coords = {"lat": float(parts[0]), "lng": float(parts[1])}
        except Exception:
            pass

    reviews_count = None
    if reviews_raw:
        reviews_count = int("".join(filter(str.isdigit, reviews_raw)))

    rating_clean = None
    if rating_raw:
        try:
            rating_clean = float(rating_raw.replace(",", "."))
        except Exception:
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


async def scrape_google_maps(
    query: str, location: str, max_results: int = 20
) -> List[Dict]:
    """
    Async wrapper — runs the sync Playwright scraper in a thread pool.
    This avoids the Windows asyncio subprocess NotImplementedError.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor, _scrape_sync, query, location, max_results
    )

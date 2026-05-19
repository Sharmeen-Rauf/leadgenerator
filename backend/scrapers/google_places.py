"""
Google Places API Scraper — FREE ($200 credit/month from Google).
Returns: business name, phone, address, rating, reviews, website, place_id, types.
Sign up: https://console.cloud.google.com → Enable "Places API (New)" → Create API Key.
"""

import httpx
from typing import List, Dict

GOOGLE_PLACES_BASE = "https://maps.googleapis.com/maps/api/place"


async def google_places_search(
    query: str,
    location: str,
    api_key: str,
    max_results: int = 20,
) -> List[Dict]:
    """
    Google Places Text Search API — $200 free credit/month (~11,700 calls).
    The most reliable business data source available.
    """
    results = []
    search_text = f"{query} in {location}"

    async with httpx.AsyncClient(timeout=15) as client:
        # Text Search
        params = {
            "query": search_text,
            "key": api_key,
        }
        r = await client.get(
            f"{GOOGLE_PLACES_BASE}/textsearch/json", params=params
        )
        data = r.json()

        if data.get("status") != "OK":
            print(f"[GooglePlaces] Error: {data.get('status')} — {data.get('error_message', '')}")
            return results

        places = data.get("results", [])[:max_results]
        print(f"[GooglePlaces] Text search returned {len(places)} results")

        # Get details for each place
        for place in places:
            place_id = place.get("place_id")
            if not place_id:
                continue

            # Fetch full details (phone, website, hours)
            detail = await _get_place_details(client, place_id, api_key)

            biz = {
                "name": place.get("name"),
                "address": place.get("formatted_address"),
                "rating": place.get("rating"),
                "reviews": place.get("user_ratings_total", 0),
                "category": ", ".join(place.get("types", [])[:2]),
                "place_id": place_id,
                "coordinates": {
                    "lat": place.get("geometry", {}).get("location", {}).get("lat"),
                    "lng": place.get("geometry", {}).get("location", {}).get("lng"),
                },
                "business_status": place.get("business_status", "OPERATIONAL"),
                "source": "google_places",
                # From details
                "phone": detail.get("phone"),
                "website": detail.get("website"),
                "hours": detail.get("hours"),
            }
            results.append(biz)
            print(f"[GooglePlaces] {biz['name']} — {biz['rating']}★ ({biz['reviews']} reviews)")

        # Handle pagination (next_page_token)
        next_token = data.get("next_page_token")
        if next_token and len(results) < max_results:
            import asyncio
            await asyncio.sleep(2)  # Google requires a delay before using next_page_token
            params2 = {"pagetoken": next_token, "key": api_key}
            r2 = await client.get(
                f"{GOOGLE_PLACES_BASE}/textsearch/json", params=params2
            )
            data2 = r2.json()
            for place in data2.get("results", [])[:max_results - len(results)]:
                place_id = place.get("place_id")
                detail = await _get_place_details(client, place_id, api_key) if place_id else {}
                results.append({
                    "name": place.get("name"),
                    "address": place.get("formatted_address"),
                    "rating": place.get("rating"),
                    "reviews": place.get("user_ratings_total", 0),
                    "category": ", ".join(place.get("types", [])[:2]),
                    "place_id": place_id,
                    "coordinates": {
                        "lat": place.get("geometry", {}).get("location", {}).get("lat"),
                        "lng": place.get("geometry", {}).get("location", {}).get("lng"),
                    },
                    "business_status": place.get("business_status", "OPERATIONAL"),
                    "source": "google_places",
                    "phone": detail.get("phone"),
                    "website": detail.get("website"),
                    "hours": detail.get("hours"),
                })

    print(f"[GooglePlaces] Total: {len(results)} businesses")
    return results


async def _get_place_details(
    client: httpx.AsyncClient, place_id: str, api_key: str
) -> Dict:
    """Fetch phone number, website, and hours from Place Details API."""
    try:
        params = {
            "place_id": place_id,
            "fields": "formatted_phone_number,website,opening_hours",
            "key": api_key,
        }
        r = await client.get(
            f"{GOOGLE_PLACES_BASE}/details/json", params=params
        )
        data = r.json()
        result = data.get("result", {})

        hours_list = None
        opening_hours = result.get("opening_hours")
        if opening_hours:
            hours_list = opening_hours.get("weekday_text")

        return {
            "phone": result.get("formatted_phone_number"),
            "website": result.get("website"),
            "hours": hours_list,
        }
    except Exception as e:
        print(f"[GooglePlaces] Details error: {e}")
        return {}

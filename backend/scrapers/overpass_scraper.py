"""
OpenStreetMap Overpass Scraper — Completely free, unlimited, no signup.
Queries the Overpass API for business data from OpenStreetMap.
"""

import httpx
from typing import List, Dict

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Map common business types to OpenStreetMap tags
OSM_TAG_MAP = {
    "roofing": ("craft", "roofer"),
    "restaurant": ("amenity", "restaurant"),
    "dental": ("amenity", "dentist"),
    "dentist": ("amenity", "dentist"),
    "gym": ("leisure", "fitness_centre"),
    "hotel": ("tourism", "hotel"),
    "lawyer": ("office", "lawyer"),
    "accountant": ("office", "accountant"),
    "plumber": ("craft", "plumber"),
    "electrician": ("craft", "electrician"),
    "beauty salon": ("shop", "beauty"),
    "salon": ("shop", "beauty"),
    "car repair": ("shop", "car_repair"),
    "mechanic": ("shop", "car_repair"),
    "pharmacy": ("amenity", "pharmacy"),
    "supermarket": ("shop", "supermarket"),
    "cafe": ("amenity", "cafe"),
    "bar": ("amenity", "bar"),
    "school": ("amenity", "school"),
    "hospital": ("amenity", "hospital"),
    "bank": ("amenity", "bank"),
    "real estate": ("office", "estate_agent"),
}


async def overpass_search(
    query: str,
    city: str,
    country: str = "US",
    max_results: int = 50
) -> List[Dict]:
    """
    OpenStreetMap Overpass API — completely unlimited and free.
    Great for bulk scraping without API limits.
    """
    query_lower = query.lower().strip()

    # Find matching OSM tag or use name search
    if query_lower in OSM_TAG_MAP:
        tag_key, tag_val = OSM_TAG_MAP[query_lower]
        tag_filter = f'"{tag_key}"="{tag_val}"'
    else:
        # Fuzzy name search fallback
        tag_filter = f'"name"~"{query}",i'

    overpass_query = f"""
    [out:json][timeout:60];
    area["name"~"{city}","ISO3166-1"~"{country}"]->.searchArea;
    (
      node[{tag_filter}](area.searchArea);
      way[{tag_filter}](area.searchArea);
      relation[{tag_filter}](area.searchArea);
    );
    out center meta;
    """

    print(f"[Overpass] Querying for: {query} in {city}, {country}")

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(OVERPASS_URL, data={"data": overpass_query})
        data = r.json()

        results = []
        for el in data.get("elements", []):
            tags = el.get("tags", {})

            # Get coordinates
            if el["type"] == "node":
                lat, lng = el.get("lat"), el.get("lon")
            else:
                center = el.get("center", {})
                lat, lng = center.get("lat"), center.get("lon")

            name = tags.get("name") or tags.get("brand")
            if not name:
                continue

            # Build address from OSM tags
            addr_parts = [
                tags.get("addr:housenumber", ""),
                tags.get("addr:street", ""),
                tags.get("addr:city", city),
                tags.get("addr:state", ""),
            ]
            address = ", ".join(p for p in addr_parts if p)

            results.append({
                "name": name,
                "address": address or None,
                "city": tags.get("addr:city", city),
                "state": tags.get("addr:state"),
                "zip": tags.get("addr:postcode"),
                "phone": tags.get("phone") or tags.get("contact:phone"),
                "website": tags.get("website") or tags.get("contact:website"),
                "email": tags.get("email") or tags.get("contact:email"),
                "hours": tags.get("opening_hours"),
                "coordinates": {"lat": lat, "lng": lng},
                "osm_id": el.get("id"),
                "source": "openstreetmap",
            })

            if len(results) >= max_results:
                break

        print(f"[Overpass] Found {len(results)} results")
        return results

"""
Antigravity Scraper — FastAPI Backend
Apollo + PhantomBuster + Outscraper Killer — $0/month stack.

Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import uuid
from datetime import datetime

from scrapers.google_maps import scrape_google_maps
from scrapers.overpass_scraper import overpass_search
from enrichment.email_finder import find_emails_for_business
from enrichment.phone_validator import validate_and_enrich_phone
from enrichment.website_analyzer import analyze_website
from scoring.lead_scorer import score_lead

app = FastAPI(
    title="Antigravity Scraper API",
    description="Apollo + PhantomBuster killer — 100% free stack",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store (swap to Redis for production)
jobs: dict = {}


# ====================== REQUEST MODELS ======================


class ScrapeRequest(BaseModel):
    niche: str = ""
    location: str = ""
    prompt: str = ""
    service: str = "digital_marketing"
    max_results: int = 20
    sources: List[str] = ["google_maps"]
    enrich_emails: bool = True
    analyze_websites: bool = True


class EnrichRequest(BaseModel):
    companyName: str
    website: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    domain: Optional[str] = None


# ====================== ENDPOINTS ======================


@app.get("/")
async def root():
    return {
        "message": "Antigravity Scraper API v1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.post("/api/scrape")
async def start_scrape(
    req: ScrapeRequest, background_tasks: BackgroundTasks
):
    """
    Start a full scraping job.
    Returns job_id immediately, scraping happens in background.
    Poll /api/jobs/{job_id} for results.
    """
    job_id = str(uuid.uuid4())[:8].upper()
    jobs[job_id] = {
        "id": job_id,
        "status": "running",
        "progress": 0,
        "step": "Initializing scraper...",
        "leads": [],
        "insights": "",
        "total_found": 0,
        "started_at": datetime.utcnow().isoformat(),
        "request": req.model_dump(),
    }

    background_tasks.add_task(_run_full_pipeline, job_id, req)
    return {
        "job_id": job_id,
        "status": "started",
        "message": "Scraping started in background. Poll /api/jobs/{job_id} for results.",
    }


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    """Poll this endpoint to get job status and results."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@app.post("/api/enrich")
async def enrich_single(req: EnrichRequest):
    """Enrich a single business with email, phone validation, and website analysis."""
    result = {
        "decisionMaker": "N/A",
        "directEmail": "N/A",
        "title": "Owner / Founder",
        "linkedinUrl": "N/A",
        "hasActiveAds": False,
        "website_analysis": {},
        "enrichmentStatus": "success",
    }

    # Website analysis
    website_url = req.website
    if website_url and website_url != "N/A":
        wa = await analyze_website(website_url)
        result["website_analysis"] = wa
        result["hasActiveAds"] = bool(wa.get("tracking_pixels"))

    # Email finder
    domain = req.domain
    if not domain and website_url and website_url != "N/A":
        domain = (
            website_url.replace("https://", "")
            .replace("http://", "")
            .replace("www.", "")
            .split("/")[0]
        )

    if domain:
        email_data = await find_emails_for_business(
            req.companyName, website_url, domain
        )
        if email_data.get("decision_maker_name"):
            result["decisionMaker"] = email_data["decision_maker_name"]
        if email_data.get("personal_email"):
            result["directEmail"] = email_data["personal_email"]
        elif email_data.get("generic_email"):
            result["directEmail"] = email_data["generic_email"]
        result["title"] = "Owner / Founder"

    # Phone validation
    if req.phone and req.phone != "N/A":
        phone_data = validate_and_enrich_phone(req.phone)
        result["phone_data"] = phone_data

    return result


@app.get("/api/leads")
async def get_all_leads():
    """Get all scraped leads across all jobs."""
    all_leads = []
    for job in jobs.values():
        if job.get("status") == "completed":
            all_leads.extend(job.get("leads", []))
    return {"total": len(all_leads), "leads": all_leads}


# ====================== BACKGROUND PIPELINE ======================


async def _run_full_pipeline(job_id: str, req: ScrapeRequest):
    """Full scraping + enrichment pipeline running in background."""
    job = jobs[job_id]

    try:
        raw_leads = []
        search_term = req.niche or req.prompt or ""

        # STEP 1: Scrape from Google Maps
        job["step"] = "Scraping Google Maps..."
        job["progress"] = 10

        if "google_maps" in req.sources:
            try:
                maps_results = await scrape_google_maps(
                    search_term, req.location, req.max_results
                )
                raw_leads.extend(maps_results)
                job["step"] = f"Google Maps: {len(maps_results)} found"
                job["progress"] = 30
            except Exception as e:
                print(f"[Pipeline] Google Maps error: {e}")
                job["step"] = f"Google Maps error: {str(e)[:50]}"

        # STEP 1b: Also try OpenStreetMap for more data
        if "openstreetmap" in req.sources:
            try:
                osm_results = await overpass_search(
                    search_term, req.location, max_results=req.max_results
                )
                raw_leads.extend(osm_results)
            except Exception as e:
                print(f"[Pipeline] OSM error: {e}")

        job["progress"] = 40

        # STEP 2: Deduplicate
        job["step"] = "Deduplicating & cleaning data..."
        unique_leads = _deduplicate_leads(raw_leads)

        # STEP 3: Enrich each lead
        job["step"] = f"Enriching {len(unique_leads)} leads..."
        job["progress"] = 50

        enriched_leads = []
        total = len(unique_leads[:req.max_results])

        for i, lead in enumerate(unique_leads[:req.max_results]):
            try:
                # Website analysis
                if req.analyze_websites and lead.get("website"):
                    lead["website_analysis"] = await analyze_website(
                        lead["website"]
                    )
                else:
                    lead["website_analysis"] = {
                        "exists": bool(lead.get("website")),
                        "score": 0,
                        "social_links": {},
                        "analytics": [],
                        "tracking_pixels": [],
                        "seo": {"seo_score": 0},
                    }

                # Email finding
                if req.enrich_emails:
                    domain = None
                    if lead.get("website"):
                        domain = (
                            lead["website"]
                            .replace("https://", "")
                            .replace("http://", "")
                            .replace("www.", "")
                            .split("/")[0]
                        )
                    email_data = await find_emails_for_business(
                        lead.get("name", ""), lead.get("website"), domain
                    )
                    lead["email"] = (
                        email_data.get("personal_email")
                        or email_data.get("generic_email")
                        or (
                            email_data["verified_emails"][0]
                            if email_data.get("verified_emails")
                            else None
                        )
                        or "N/A"
                    )
                    lead["decisionMaker"] = (
                        email_data.get("decision_maker_name") or "N/A"
                    )
                    lead["directEmail"] = (
                        email_data.get("personal_email") or "N/A"
                    )
                else:
                    lead["email"] = lead.get("email", "N/A")
                    lead["decisionMaker"] = "N/A"
                    lead["directEmail"] = "N/A"

                # Phone validation
                if lead.get("phone"):
                    lead["phone_data"] = validate_and_enrich_phone(
                        lead["phone"]
                    )

                # Lead scoring
                scoring = score_lead(
                    lead, lead.get("website_analysis", {}), req.service
                )
                lead["score"] = scoring["score"]
                lead["temperature"] = scoring["classification"]
                lead["scoring"] = scoring

                # Build opportunity flags for frontend compatibility
                opps = []
                if not lead.get("website"):
                    opps.append("web")
                if (lead.get("rating") or 5) < 4.0:
                    opps.append("seo")
                social = lead.get("website_analysis", {}).get(
                    "social_links", {}
                )
                if not social.get("instagram") or not social.get("facebook"):
                    opps.append("social")
                if (lead.get("reviews") or 0) < 30:
                    opps.append("ads")
                if not lead.get("website_analysis", {}).get("tracking_pixels"):
                    opps.append("email")
                lead["opps"] = opps

                # Normalize field names for frontend
                lead["companyName"] = lead.get("name", "Unknown")
                lead["city"] = lead.get("city") or req.location or "N/A"
                lead["category"] = lead.get("category", "N/A")
                lead["rating"] = lead.get("rating") or 0
                lead["reviews"] = lead.get("reviews") or 0
                lead["phone"] = lead.get("phone") or "N/A"
                lead["website"] = lead.get("website") or "N/A"
                lead["address"] = lead.get("address") or "N/A"
                lead["social"] = {
                    "fb": bool(social.get("facebook")),
                    "insta": bool(social.get("instagram")),
                    "google": True,
                }

                lead["id"] = str(uuid.uuid4())[:8]
                enriched_leads.append(lead)

                job["progress"] = 50 + int((i / max(total, 1)) * 45)
                job["step"] = (
                    f"Enriching lead {i+1}/{total}: "
                    f"{lead.get('companyName', '')[:30]}"
                )

                await asyncio.sleep(0.3)

            except Exception as e:
                print(f"[Pipeline] Error enriching lead {i}: {e}")
                lead["score"] = 0
                lead["temperature"] = "Cold"
                lead["opps"] = []
                lead["companyName"] = lead.get("name", "Unknown")
                enriched_leads.append(lead)

        # STEP 4: Sort by score
        enriched_leads.sort(
            key=lambda x: x.get("score", 0), reverse=True
        )

        # Generate insights
        hot_count = len(
            [l for l in enriched_leads if l.get("temperature") == "HOT"]
        )
        avg_rating = 0
        if enriched_leads:
            avg_rating = round(
                sum(l.get("rating", 0) for l in enriched_leads)
                / len(enriched_leads),
                1,
            )

        insights = (
            f'Found {len(enriched_leads)} records for '
            f'"{search_term} in {req.location}". '
            f'{hot_count} identified as "Hot" leads. '
            f"Average rating: {avg_rating}."
        )

        job["status"] = "completed"
        job["progress"] = 100
        job["step"] = f"Complete! {len(enriched_leads)} leads ready"
        job["leads"] = enriched_leads
        job["insights"] = insights
        job["total_found"] = len(enriched_leads)
        job["hot_leads"] = hot_count
        job["completed_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        print(f"[Pipeline] Fatal error: {e}")
        job["status"] = "error"
        job["error"] = str(e)
        job["step"] = f"Error: {str(e)}"


def _deduplicate_leads(leads: List[dict]) -> List[dict]:
    """Remove duplicate businesses based on name similarity."""
    seen = set()
    unique = []
    for lead in leads:
        name = (lead.get("name") or "").lower().strip()
        city = (lead.get("city") or lead.get("address") or "")[:20].lower()
        key = f"{name[:30]}_{city}"
        if key not in seen and name:
            seen.add(key)
            unique.append(lead)
    return unique

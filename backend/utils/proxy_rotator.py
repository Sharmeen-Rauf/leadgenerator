"""
Free Proxy Rotator — Fetches and rotates free public proxies.
For production, upgrade to BrightData or Oxylabs.
"""

import httpx
import asyncio
import random
from typing import List, Optional


FREE_PROXY_SOURCES = [
    "https://proxylist.geonode.com/api/proxy-list?limit=50&page=1&sort_by=lastChecked&sort_type=desc&protocols=http",
    "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
]


class ProxyRotator:
    def __init__(self):
        self.proxies: List[str] = []
        self.working: List[str] = []
        self.current_idx = 0

    async def fetch_proxies(self):
        """Fetch fresh proxies from free sources."""
        proxies = []

        async with httpx.AsyncClient(timeout=10) as client:
            # GeoNode API
            try:
                r = await client.get(FREE_PROXY_SOURCES[0])
                data = r.json()
                for p in data.get("data", []):
                    proxies.append(f"http://{p['ip']}:{p['port']}")
            except Exception:
                pass

            # Raw proxy list
            try:
                r = await client.get(FREE_PROXY_SOURCES[1])
                lines = r.text.strip().split("\n")
                proxies.extend(
                    [f"http://{line.strip()}" for line in lines[:50]]
                )
            except Exception:
                pass

        self.proxies = list(set(proxies))
        print(f"[ProxyRotator] Fetched {len(self.proxies)} proxies")

    async def test_proxy(self, proxy: str) -> bool:
        """Test if proxy is working."""
        try:
            async with httpx.AsyncClient(proxy=proxy, timeout=5) as client:
                r = await client.get("https://httpbin.org/ip")
                return r.status_code == 200
        except Exception:
            return False

    async def get_working_proxies(self, test_count: int = 15) -> List[str]:
        """Test proxies and return working ones."""
        if not self.proxies:
            await self.fetch_proxies()

        sample = random.sample(
            self.proxies, min(test_count, len(self.proxies))
        )
        tasks = [self.test_proxy(p) for p in sample]
        results = await asyncio.gather(*tasks)

        self.working = [p for p, ok in zip(sample, results) if ok]
        print(
            f"[ProxyRotator] {len(self.working)}/{test_count} proxies working"
        )
        return self.working

    def get_next(self) -> Optional[str]:
        """Round-robin proxy selection."""
        if not self.working:
            return None
        proxy = self.working[self.current_idx % len(self.working)]
        self.current_idx += 1
        return proxy

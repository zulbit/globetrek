import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
OUTPUT_GUIDE_DIR = "public/images/guide"
OUTPUT_WHITEPAPER_DIR = "public/images/whitepaper"

PAGES = [
    {
        "url": f"{BASE_URL}/auth",
        "output": f"{OUTPUT_GUIDE_DIR}/auth-page.png",
        "title": "Auth Page",
    },
    {
        "url": f"{BASE_URL}/",
        "output": f"{OUTPUT_GUIDE_DIR}/landing-page.png",
        "title": "Landing Page",
    },
    {
        "url": f"{BASE_URL}/tours",
        "output": f"{OUTPUT_GUIDE_DIR}/properties-page.png",
        "title": "Tours Catalog Page",
    },
    {
        "url": f"{BASE_URL}/vendor",
        "output": f"{OUTPUT_GUIDE_DIR}/vendor-dashboard.png",
        "title": "Vendor Dashboard Overview",
    },
    {
        "url": f"{BASE_URL}/vendor/leads",
        "output": f"{OUTPUT_GUIDE_DIR}/vendor-leads-marketplace.png",
        "title": "Vendor Leads Bidding Marketplace",
    },
    {
        "url": f"{BASE_URL}/vendor-guide",
        "output": f"{OUTPUT_GUIDE_DIR}/vendor-guide-page.png",
        "title": "Vendor Master Operating Guide",
    },
    {
        "url": f"{BASE_URL}/enterprise",
        "output": f"{OUTPUT_WHITEPAPER_DIR}/enterprise-page.png",
        "title": "Enterprise Showcase Page",
    },
]

def capture_showcase_screenshots():
    print(f"Starting GlobeTrek PK Playwright Showcase Screenshot Capture from {BASE_URL}...")
    os.makedirs(OUTPUT_GUIDE_DIR, exist_ok=True)
    os.makedirs(OUTPUT_WHITEPAPER_DIR, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        for item in PAGES:
            try:
                print(f"Capturing [{item['title']}] from {item['url']}...")
                page.goto(item["url"], wait_until="networkidle", timeout=15000)
                time.sleep(1) # Allow animations to resolve
                page.screenshot(path=item["output"], full_page=False)
                print(f" Saved -> {item['output']}")
            except Exception as e:
                print(f" Warning capturing {item['title']}: {e}")

        browser.close()
    print("All GlobeTrek PK showcase screenshots captured successfully!")

if __name__ == "__main__":
    capture_showcase_screenshots()

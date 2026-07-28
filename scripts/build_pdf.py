import os
import sys
from playwright.sync_api import sync_playwright

def build_vendor_guide_pdf():
    url = os.environ.get("GUIDE_URL", "http://localhost:8080/vendor-guide")
    output_path = os.environ.get("PDF_OUTPUT", "public/vendor-guide.pdf")

    print(f"Generating PDF for GlobeTrek PK Vendor Guide from {url}...")

    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 960})
        page = context.new_page()

        # Navigate to Vendor Guide
        page.goto(url, wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(2000)

        # Emulate print media for full document layout
        page.emulate_media(media="print")

        # Generate PDF with clean margins, headers, and footers
        page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={
                "top": "15mm",
                "right": "15mm",
                "bottom": "15mm",
                "left": "15mm"
            },
            header_template='<div style="font-size:8px; font-family:sans-serif; text-align:center; width:100%; color:#666;">GlobeTrek PK — Vendor & Agency Operating Guide</div>',
            footer_template='<div style="font-size:8px; font-family:sans-serif; text-align:center; width:100%; color:#666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
            display_header_footer=True
        )

        browser.close()
        print(f"PDF successfully generated and saved to: {output_path}")

if __name__ == "__main__":
    build_vendor_guide_pdf()

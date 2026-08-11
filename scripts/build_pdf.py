import os
import sys
import tempfile
import re
from playwright.sync_api import sync_playwright

OUTPUT_PDF_PATH = "public/vendor-guide.pdf"

# HTML Template with Executive Styling, Cover Page, TOC, and Clean Pure-White Print Layout
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GlobeTrek PK — Vendor & Agency Operating Manual</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 16mm 20mm 16mm;
    @top-center {
      content: "GlobeTrek PK — Vendor & Agency Operating Manual (2026 Edition)";
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
      border-bottom: 0.5pt solid #cbd5e1;
      padding-bottom: 4px;
      width: 100%;
    }
    @bottom-left {
      content: "Official Partner Governance Document · Confidential";
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
    @bottom-right {
      content: "Page " counter(page);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      font-weight: 700;
      color: #047857;
    }
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #1e293b;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* COVER PAGE */
  .cover-page {
    page-break-after: always;
    height: 100%;
    min-height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20mm 15mm 15mm 15mm;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
  }

  .cover-top-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 10px;
    background: linear-gradient(90deg, #047857 0%, #10b981 50%, #f59e0b 100%);
  }

  .cover-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-logo {
    font-size: 26pt;
    font-weight: 900;
    color: #047857;
    letter-spacing: -1px;
  }

  .brand-tag {
    background: #047857;
    color: #ffffff;
    font-size: 10pt;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 6px;
  }

  .cover-hero {
    margin-top: 30mm;
    margin-bottom: 25mm;
  }

  .cover-badge {
    display: inline-block;
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 9pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 15px;
  }

  .cover-title {
    font-size: 26pt;
    font-weight: 900;
    color: #0f172a;
    line-height: 1.15;
    margin: 0 0 15px 0;
    letter-spacing: -0.5px;
  }

  .cover-subtitle {
    font-size: 12pt;
    color: #475569;
    line-height: 1.5;
    margin: 0;
    max-width: 90%;
  }

  .cover-meta-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
    margin-top: 20mm;
  }

  .meta-item {
    font-size: 9pt;
  }

  .meta-label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .meta-value {
    font-size: 9.5pt;
    font-weight: 700;
    color: #0f172a;
  }

  .cover-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    font-size: 8pt;
    color: #64748b;
  }

  /* TABLE OF CONTENTS */
  .toc-page {
    page-break-after: always;
    padding-top: 10mm;
  }

  .toc-title {
    font-size: 18pt;
    font-weight: 900;
    color: #0f172a;
    border-bottom: 2px solid #047857;
    padding-bottom: 8px;
    margin-bottom: 20px;
  }

  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .toc-item {
    margin-bottom: 12px;
  }

  .toc-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .toc-name {
    font-size: 10pt;
    font-weight: 700;
    color: #0f172a;
  }

  .toc-leader {
    flex: 1;
    border-bottom: 1px dotted #94a3b8;
    margin: 0 10px;
    height: 1px;
  }

  .toc-page-num {
    font-size: 10pt;
    font-weight: 800;
    color: #047857;
    font-family: 'JetBrains Mono', monospace;
  }

  .toc-desc {
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 2px;
    padding-left: 2px;
  }

  /* CHAPTER STYLING */
  .chapter {
    page-break-after: always;
    padding-top: 6mm;
  }

  .chapter:last-child {
    page-break-after: auto;
  }

  .chapter-header {
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }

  .chapter-num {
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #047857;
    margin-bottom: 4px;
  }

  h1 {
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 8px 0;
    line-height: 1.3;
    letter-spacing: -0.3px;
  }

  h2 {
    font-size: 13pt;
    font-weight: 800;
    color: #065f46;
    margin: 20px 0 10px 0;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }

  h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #1e293b;
    margin: 16px 0 8px 0;
  }

  h4 {
    font-size: 10pt;
    font-weight: 700;
    color: #0f172a;
    margin: 12px 0 6px 0;
  }

  p {
    margin: 0 0 12px 0;
    color: #334155;
    font-size: 9.5pt;
    line-height: 1.6;
  }

  strong {
    font-weight: 700;
    color: #0f172a;
  }

  ul, ol {
    margin: 0 0 14px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 6px;
    color: #334155;
    font-size: 9.5pt;
    line-height: 1.5;
  }

  /* CALLOUT BOXES */
  .callout {
    border-radius: 8px;
    padding: 12px 16px;
    margin: 16px 0;
    font-size: 9pt;
    line-height: 1.5;
  }

  .callout-note {
    background: #f0f9ff;
    border-left: 4px solid #0284c7;
    color: #0369a1;
  }

  .callout-note strong {
    color: #0c4a6e;
  }

  .callout-tip {
    background: #ecfdf5;
    border-left: 4px solid #059669;
    color: #047857;
  }

  .callout-tip strong {
    color: #064e3b;
  }

  .callout-warning {
    background: #fffbeb;
    border-left: 4px solid #d97706;
    color: #b45309;
  }

  .callout-warning strong {
    color: #78350f;
  }

  /* TABLES */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 8.5pt;
  }

  th {
    background: #064e3b;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #064e3b;
  }

  td {
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    color: #334155;
  }

  tr:nth-child(even) {
    background: #f8fafc;
  }

  /* CODE & MONO */
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  /* SCREENSHOTS / DIAGRAMS */
  .screenshot-box {
    margin: 16px 0;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    background: #f8fafc;
    text-align: center;
  }

  .screenshot-box img {
    max-width: 100%;
    height: auto;
    display: block;
    border-bottom: 1px solid #e2e8f0;
  }

  .screenshot-caption {
    padding: 6px 12px;
    font-size: 8pt;
    font-weight: 600;
    color: #64748b;
    background: #f8fafc;
  }

  hr {
    border: 0;
    height: 1px;
    background: #e2e8f0;
    margin: 20px 0;
  }
</style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-top-accent"></div>
    
    <div>
      <div class="cover-brand">
        <span class="brand-logo">GlobeTrek</span>
        <span class="brand-tag">PK</span>
      </div>

      <div class="cover-hero">
        <div class="cover-badge">Official Partner Manual · Release 2026.2</div>
        <h1 class="cover-title">Vendor &amp; Agency<br/>Operating Manual</h1>
        <p class="cover-subtitle">
          Comprehensive Operational Governance, Real-Time Lead Bidding Protocols, 
          B2B Custom Visa Consultation Engine &amp; AI Automation Infrastructure for Pakistani Travel Agencies.
        </p>
      </div>
    </div>

    <div>
      <div class="cover-meta-grid">
        <div class="meta-item">
          <div class="meta-label">Issuance Authority</div>
          <div class="meta-value">GlobeTrek Partner Audit &amp; Governance Division</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Regulatory Alignment</div>
          <div class="meta-value">DTS Licensing &amp; FBR NTN Standards</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Target Industry Verticals</div>
          <div class="meta-value">Tour Operators, Visa Desks, Insurance Brokers, Ticketing</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Payment &amp; Currency</div>
          <div class="meta-value">100% PKR Transparent Settlements via SafePay</div>
        </div>
      </div>

      <div class="cover-footer">
        <span>https://globetrek.pk · Partner Helpdesk: +92 300 0000000</span>
        <span>Strictly for Authorized Partner Agencies · Commercial Edition</span>
      </div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <ul class="toc-list">
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">1. Introduction to the GlobeTrek Ecosystem</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 03</span>
        </div>
        <div class="toc-desc">Platform architecture, partner philosophy, universal search, and commercial advantages.</div>
      </li>
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">2. Vendor Registration &amp; Verification (KYC Compliance)</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 04</span>
        </div>
        <div class="toc-desc">Document requirements, DTS license verification, and 24-hour account audit procedure.</div>
      </li>
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">3. GlobeTrek AI Engine — All 4 Production Tools &amp; Tier Quotas</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 05</span>
        </div>
        <div class="toc-desc">Bilingual AI Concierge (Roman Urdu &amp; English), AI Trip Planner, Embassy Fee Lookup &amp; AI Assistant.</div>
      </li>
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">4. Custom Group Tour Requests &amp; Lead Bidding System</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 06</span>
        </div>
        <div class="toc-desc">Admin budget vetting, Max 3 vendor unlock limit (₨ 5,000 fee), and WhatsApp quote comparison.</div>
      </li>
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">5. Custom Visa Leads &amp; Refusal Rectification Engine</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 07</span>
        </div>
        <div class="toc-desc">Instant auto-publishing, ₨ 750 SafePay unlock fee, 5-bid cap, refusal appeal clauses &amp; Gerry's/VFS drop-boxes.</div>
      </li>
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">6. Vendor Console Navigation &amp; 30-Day Activity Analytics</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 08</span>
        </div>
        <div class="toc-desc">Service-filtered lead activity line charts, Coral Rose line (#f43f5e), and direct inbox controls.</div>
      </li>
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">7. SafePay Gateway Payments, Receipts &amp; Subscriptions</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 09</span>
        </div>
        <div class="toc-desc">Starter vs Pro subscriptions, SafePay QuickLinks V2, automated WhatsApp receipts, and fee schedules.</div>
      </li>
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">8. Marketplace Quality Standards, Business Ratings &amp; Trust Badges</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 10</span>
        </div>
        <div class="toc-desc">Traveler ratings, verified partner governance, quote turnaround benchmarks, and gold badges.</div>
      </li>
      <li class="toc-item">
        <div class="toc-row">
          <span class="toc-name">9. Partner Frequently Asked Questions &amp; Operational Protocols</span>
          <span class="toc-leader"></span>
          <span class="toc-page-num">Page 11</span>
        </div>
        <div class="toc-desc">Comprehensive reference on lead handling, multi-branch operations, and dispute resolutions.</div>
      </li>
    </ul>
  </div>

  <!-- CHAPTER 1 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 01 · Ecosystem Architecture</div>
      <h1>Introduction to the GlobeTrek Ecosystem</h1>
    </div>

    <p>
      Welcome to <strong>GlobeTrek PK</strong> — Pakistan's premier digital B2B marketplace and AI-powered travel ecosystem. 
      Built specifically for verified Pakistani tour operators, visa consultants, travel insurance brokers, and ticketing desks, 
      GlobeTrek PK bridges the traditional gap between ambitious travel agencies and digital-first travelers across Pakistan and the overseas diaspora.
    </p>

    <div class="callout callout-note">
      <strong>Core Partner Philosophy:</strong> We do not compete with travel agencies — we empower them. 
      GlobeTrek PK operates on a partner-first model where verified agencies maintain direct client relationships while leveraging enterprise-grade AI and automated lead generation.
    </div>

    <h2>The Four Synchronized Operational Pillars</h2>
    <ul>
      <li><strong>Marketplace Discovery &amp; Universal Search:</strong> Travelers browse multi-category services (Tour Packages, Visas, Travel Insurance, and Flights) categorized by country, departure city, and budget in PKR with 0% hidden FX conversion fees.</li>
      <li><strong>AI-Powered Lead Engine:</strong> Our built-in bilingual (English &amp; Roman Urdu) AI Concierge engages web visitors 24/7, answering destination questions, providing visa guidance, and capturing qualified customer contact leads.</li>
      <li><strong>Custom Lead Bidding Desks:</strong> Travelers requesting bespoke group tours or visa filing submit structured requests. Verified vendors receive instant alerts and submit online quotations directly to traveler WhatsApp inboxes.</li>
      <li><strong>Verified Partner Governance:</strong> Every agency undergoes Department of Tourist Services (DTS) and NTN verification, building immense traveler trust and ensuring a high-quality marketplace standard.</li>
    </ul>

    <h2>Key Commercial Benefits for GlobeTrek Partners</h2>
    <table>
      <thead>
        <tr>
          <th>Capability</th>
          <th>Traditional Agency Reality</th>
          <th>GlobeTrek PK Partner Model</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Customer Acquisition</strong></td>
          <td>High ad spend on Meta/Google with cold, unvetted leads</td>
          <td>Direct high-intent traveler leads with full dates, pax count &amp; PKR budget</td>
        </tr>
        <tr>
          <td><strong>Itinerary Creation</strong></td>
          <td>2–4 hours manual typing on Word/PowerPoint</td>
          <td>10-second automated AI Trip Planner with day-by-day activities &amp; pricing</td>
        </tr>
        <tr>
          <td><strong>Visa Refusal Leads</strong></td>
          <td>Word-of-mouth client walk-ins</td>
          <td>High-intent custom visa inquiries with exact refusal clauses for ₨ 750</td>
        </tr>
        <tr>
          <td><strong>Payment Processing</strong></td>
          <td>Manual cash deposits or unverified bank receipts</td>
          <td>Automated SafePay QuickLinks V2 with instant WhatsApp payment receipts</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- CHAPTER 2 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 02 · Onboarding &amp; Compliance</div>
      <h1>Vendor Registration &amp; Verification (KYC)</h1>
    </div>

    <p>
      To maintain traveler confidence and prevent fraudulent operators, all travel partners undergo a strict 
      identity and regulatory audit before their packages and services are published live.
    </p>

    <h2>Step-by-Step Onboarding Workflow</h2>
    <ol>
      <li><strong>Account Registration:</strong> Visit the Partner Portal (<code>/auth</code>) and register your agency's legal business name, official business email, WhatsApp contact number, and operational branch city.</li>
      <li><strong>Service Category Selection:</strong> Choose your active business verticals: Tour Packages, Visa Services, Travel Insurance, or Flight/Umrah Desks.</li>
      <li><strong>Document Submission:</strong> Upload scanned copies of the required regulatory credentials via the KYC Portal (<code>/vendor/kyc</code>).</li>
    </ol>

    <h2>Mandatory KYC Credentials Checklist</h2>
    <ul>
      <li><strong>Authorized Signatory CNIC / Passport:</strong> Valid government ID of the agency proprietor or managing director.</li>
      <li><strong>Department of Tourist Services (DTS) License:</strong> Valid DTS registration certificate or official operational permit.</li>
      <li><strong>FBR NTN Registration Certificate:</strong> Official National Tax Number document proving registered business status.</li>
      <li><strong>Corporate Bank IBAN / SafePay Account:</strong> Verified Pakistani bank account for lead unlock fee settlements and refunds.</li>
    </ul>

    <div class="callout callout-tip">
      <strong>24-Hour Express Audit:</strong> The GlobeTrek Partner Verification Desk audits submitted documentation within 24 business hours. 
      Upon approval, your Vendor Console is unlocked with the official 🛡️ <strong>"Verified Partner"</strong> trust badge.
    </div>
  </div>

  <!-- CHAPTER 3 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 03 · AI Tools &amp; Automation</div>
      <h1>GlobeTrek AI Engine — All 4 Production Tools</h1>
    </div>

    <p>
      GlobeTrek PK embeds four production AI services powered by OpenRouter models to accelerate travel operations:
    </p>

    <h2>1. Bilingual AI Travel Concierge (Customer-Facing)</h2>
    <p>
      <strong>Location:</strong> Floating chat widget on all public pages · <strong>Access:</strong> Available to all visitors.
    </p>
    <ul>
      <li><strong>Bilingual Language Mirroring:</strong> Responds fluently in English or natural Roman Urdu based on user prompt.</li>
      <li><strong>Database Grounding:</strong> Answers traveler queries using live database listings for tours, visas, insurance, and ticketing.</li>
      <li><strong>Automated Lead Capture:</strong> Fired via server tool <code>capture_lead</code> when the visitor requests a callback or booking.</li>
    </ul>

    <h2>2. Premium AI Trip Planner (Vendor Console)</h2>
    <p>
      <strong>Location:</strong> Vendor Console → Tours → "Generate with AI" · <strong>Quota:</strong> Pro Plan (50/mo), Agency (Unlimited).
    </p>
    <p>
      Takes destination country, duration, departure hub, and budget in PKR, generating a full day-by-day itinerary with morning/afternoon/evening activities and hotel recommendations in under 10 seconds.
    </p>

    <h2>3. AI Embassy Fee Lookup (Visa Console)</h2>
    <p>
      <strong>Location:</strong> Vendor Console → Visa Services → "AI Fee Lookup".
    </p>
    <p>
      Provides real-time embassy visa fee estimates in PKR and foreign currency (GBP, EUR, USD, CAD, SAR) with source confidence ratings for Schengen, UK, US, Canada, Turkey, and Gulf visas.
    </p>

    <h2>4. AI Partner Operational Assistant (Vendor Guide)</h2>
    <p>
      <strong>Location:</strong> Embedded in <code>/vendor-guide</code> · <strong>Access:</strong> Free for all partners.
    </p>
    <p>
      Answers operational questions regarding DTS license audits, lead unlock caps, SafePay payouts, and plan features in English and Roman Urdu.
    </p>
  </div>

  <!-- CHAPTER 4 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 04 · Custom Tour Marketplace</div>
      <h1>Custom Tour Requests &amp; Lead Bidding System</h1>
    </div>

    <p>
      Custom Tour Leads represent high-value private group inquiries (families, corporate retreats, honeymoons) submitted through the website or AI Concierge.
    </p>

    <h2>Key Lead Bidding Operating Rules</h2>
    <ul>
      <li><strong>Admin Budget &amp; Intent Verification:</strong> Every custom tour lead is called by the GlobeTrek verification desk to confirm travel dates, group count, and budget before publishing to the marketplace.</li>
      <li><strong>Strict Max 3 Vendor Unlock Cap:</strong> To prevent price wars and aggressive telemarketing, each lead is capped at <strong>3 unlocking agencies</strong>. Once 3 agencies unlock a lead for ₨ 5,000, it automatically transitions to Sold Out.</li>
      <li><strong>Online Proposal Builder:</strong> Unlocked agencies enter hotel details, flight inclusions, itinerary highlights, and total price in PKR.</li>
      <li><strong>WhatsApp Notification Engine:</strong> Submitting a proposal instantly sends a formatted WhatsApp message to the traveler with a direct link to compare bids online (<code>/customer/quotes?token=...</code>).</li>
      <li><strong>Quote Acceptance:</strong> When the traveler selects your quote, the system alerts you on WhatsApp with direct contact details and marks the lead as Accepted.</li>
    </ul>

    <div class="callout callout-warning">
      <strong>12-Hour Proposal Benchmark:</strong> Agencies are required to submit structured quotations within 12 hours of unlocking a lead to maintain high customer conversion rates.
    </div>
  </div>

  <!-- CHAPTER 5 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 05 · Custom Visa &amp; Refusal Engine</div>
      <h1>Custom Visa Leads &amp; Refusal Rectification Engine</h1>
    </div>

    <p>
      In the Pakistani market, visa refusal rates for Schengen, UK, US, and Canada create high demand for expert visa file preparation and appeal consultation. 
      GlobeTrek PK operates a specialized B2B Custom Visa Leads Marketplace.
    </p>

    <h2>Core Architecture &amp; Commercial Terms</h2>
    <ul>
      <li><strong>Instant Auto-Verification:</strong> Visa leads are auto-verified and broadcasted immediately to the B2B marketplace with zero admin delays.</li>
      <li><strong>₨ 750 Lead Unlock Fee:</strong> Any verified visa consultant can unlock full applicant contact details for an accessible <strong>₨ 750</strong> via SafePay QuickLink V2.</li>
      <li><strong>Competitive 5-Quotation Limit:</strong> Each lead is capped at <strong>5 vendor unlocks</strong>, giving the applicant multiple qualified options while preserving agency conversion odds.</li>
      <li><strong>Refusal Case Categorization:</strong> Cases are tagged with prior refusal history and rejection clauses (e.g. <em>UK Paragraph V4.2</em>, <em>US 214(b)</em>, <em>Schengen Purpose of Stay</em>).</li>
      <li><strong>📍 Local Client Match Badging:</strong> Automatically highlights applicants residing in the same city as your agency branches (Islamabad, Lahore, Karachi, Rawalpindi, Peshawar, Faisalabad, Sialkot).</li>
      <li><strong>Submission Office Identification:</strong> Identifies preferred drop-box centers: Gerry's Visa Drop Box, VFS Global, Anatolia (Turkey), or Direct Embassy.</li>
    </ul>

    <h2>Vendor Proposal &amp; Inclusions Builder</h2>
    <table>
      <thead>
        <tr>
          <th>Proposal Component</th>
          <th>Description &amp; Deliverables</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Service / Consultancy Fee</strong></td>
          <td>Agency file compilation &amp; review charges in PKR</td>
        </tr>
        <tr>
          <td><strong>Est. Embassy / Drop-Box Fee</strong></td>
          <td>Official government and Gerry's/VFS fee estimate in PKR</td>
        </tr>
        <tr>
          <td><strong>File Turnaround Timeline</strong></td>
          <td>Expected file completion (e.g. 5–7 business days)</td>
        </tr>
        <tr>
          <td><strong>Consultation Mode</strong></td>
          <td>🏢 In-Person Office Visit vs 🌐 100% Online E-Filing</td>
        </tr>
        <tr>
          <td><strong>Standard Inclusions</strong></td>
          <td>Document Audit, Cover Letter, Drop-Box Appointment Slot, FBR Review, Mock Interview</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- CHAPTER 6 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 06 · Console Controls &amp; Analytics</div>
      <h1>Vendor Console Navigation &amp; 30-Day Analytics</h1>
    </div>

    <p>
      The Vendor Console (<code>/vendor</code>) provides complete operational command over listings, customer inquiries, and commercial metrics.
    </p>

    <h2>30-Day Lead Activity Multi-Line Chart</h2>
    <p>
      The dashboard renders service-filtered time-series lines based on your agency's active vertical offerings:
    </p>
    <ul>
      <li>🟢 <strong>Emerald Line (#10b981):</strong> Tour Package Inquiries</li>
      <li>🩵 <strong>Sky Blue Line (#0ea5e9):</strong> Visa Application Inquiries</li>
      <li>🟣 <strong>Violet Line (#8b5cf6):</strong> Travel Insurance Inquiries</li>
      <li>🟡 <strong>Amber Line (#f59e0b):</strong> Flight &amp; Umrah Ticket Inquiries</li>
      <li>🌹 <strong>Coral Rose Line (#f43f5e):</strong> Purchased Custom Tour &amp; Visa Leads</li>
    </ul>

    <h2>Real-Time Lead Alerts &amp; Teasers</h2>
    <ul>
      <li><strong>Live Inquiries Feed:</strong> Direct customer inquiries from catalog listings, including customer name, phone number, and requested travel date.</li>
      <li><strong>Custom Leads Teaser Banners:</strong> Live notification banners displaying new unbidded tour and visa requests ready for unlock.</li>
      <li><strong>Direct WhatsApp Quick-Links:</strong> One-click WhatsApp chat buttons pre-filled with customer inquiry context.</li>
    </ul>
  </div>

  <!-- CHAPTER 7 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 07 · Billing &amp; Settlements</div>
      <h1>SafePay Gateway Payments, Receipts &amp; Subscriptions</h1>
    </div>

    <p>
      GlobeTrek PK partners with <strong>SafePay Gateway</strong> for secure PKR payment processing, instant wallet settlements, and automated receipts.
    </p>

    <h2>Subscription Tiers &amp; Commercial Comparison</h2>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Starter Plan (₨ 3,500/mo)</th>
          <th>Pro Plan (₨ 7,500/mo)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Active Tour Listings</strong></td>
          <td>Up to 5 Packages</td>
          <td>Unlimited Packages</td>
        </tr>
        <tr>
          <td><strong>Universal Search Placement</strong></td>
          <td>Standard Ranking</td>
          <td>Priority Top Placement</td>
        </tr>
        <tr>
          <td><strong>AI Trip Planner Quota</strong></td>
          <td>10 Itineraries / Month</td>
          <td>50 Itineraries / Month</td>
        </tr>
        <tr>
          <td><strong>Interactive Map Placement</strong></td>
          <td>Standard Dot</td>
          <td>Full Flight Arc &amp; Route Hub</td>
        </tr>
        <tr>
          <td><strong>Custom Tour Unlock Fee</strong></td>
          <td>₨ 5,000 / Lead</td>
          <td>₨ 5,000 / Lead</td>
        </tr>
        <tr>
          <td><strong>Custom Visa Unlock Fee</strong></td>
          <td>₨ 750 / Lead</td>
          <td>₨ 750 / Lead</td>
        </tr>
        <tr>
          <td><strong>Trust Badge</strong></td>
          <td>🛡️ Verified Partner</td>
          <td>🥇 Gold Tier Vendor</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-tip">
      <strong>Automated WhatsApp Invoicing:</strong> Every SafePay transaction (subscription renewal or lead unlock) automatically generates an official digital PDF receipt delivered to your registered WhatsApp mobile number.
    </div>
  </div>

  <!-- CHAPTER 8 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 08 · Quality Governance</div>
      <h1>Marketplace Quality Standards &amp; Trust Badges</h1>
    </div>

    <p>
      To safeguard traveler trust and ensure reliable service delivery, all GlobeTrek partners adhere to mandatory quality commitments:
    </p>

    <h2>Mandatory Partner Commitments</h2>
    <ul>
      <li><strong>Transparent Total Pricing:</strong> Listed rates in PKR must reflect the complete price with explicit inclusion and exclusion notes. Hidden surcharges upon booking are strictly prohibited.</li>
      <li><strong>Honest Hotel Classifications:</strong> Hotel star ratings (3-Star / 4-Star / 5-Star) must match official government hospitality certifications.</li>
      <li><strong>12-Hour Quotation Turnaround:</strong> Partner agencies are expected to respond to unlocked custom inquiries within 12 hours.</li>
      <li><strong>Data Privacy &amp; Anti-Spam:</strong> Unlocked traveler contact details must be used solely for the requested travel consultation. Re-selling or mass-marketing leads is grounds for permanent suspension.</li>
    </ul>

    <h2>Public Trust Badges &amp; Rating Scorecard</h2>
    <ul>
      <li>🛡️ <strong>"Verified Partner" Badge:</strong> Awarded upon passing initial DTS and NTN KYC audit.</li>
      <li>🥇 <strong>"Gold Tier Vendor" Badge:</strong> Awarded to Pro Plan agencies maintaining an active 4.5+ star review rating.</li>
      <li>⚡ <strong>"Fast Responder" Badge:</strong> Automatically assigned to agencies averaging quotation delivery under 6 hours.</li>
    </ul>
  </div>

  <!-- CHAPTER 9 -->
  <div class="chapter">
    <div class="chapter-header">
      <div class="chapter-num">Chapter 09 · Partner FAQ</div>
      <h1>Frequently Asked Questions &amp; Operational Reference</h1>
    </div>

    <h2>Frequently Asked Partner Questions</h2>
    
    <p><strong>Q: What happens if a traveler does not answer after unlocking a custom lead?</strong><br/>
    <em>A: GlobeTrek Admin pre-vets custom tour leads. For visa leads, applicants are auto-verified. If an applicant number is invalid or unreachable within 48 hours, contact the Partner Helpdesk for account lead credit adjustment.</em></p>
    
    <p><strong>Q: Can our agency offer in-person consultations in multiple cities?</strong><br/>
    <em>A: Yes. You can register multi-city branches (e.g. Head Office Islamabad, Branch Lahore) in your Vendor Profile. The system will activate the 📍 Local Client match badge across all your operational locations.</em></p>

    <p><strong>Q: How does SafePay lead unlocking work?</strong><br/>
    <em>A: Clicking "Unlock Contact Details" opens a pre-filled SafePay QuickLink for ₨ 750 (Visa) or ₨ 5,000 (Tour). You pay via Debit/Credit Card or Mobile Wallet. Upon completion, full contact details are unmasked immediately.</em></p>

    <p><strong>Q: What if our subscription plan expires?</strong><br/>
    <em>A: Listings enter a 7-day grace period. After 7 days, active listings are paused in universal search until renewed. Lead bidding history remains permanently preserved in your portal.</em></p>

    <div class="callout callout-note">
      <strong>Need Dedicated Assistance?</strong> Contact the GlobeTrek PK Partner Desk at <code>support@globetrek.pk</code> or via verified WhatsApp Partner Concierge.
    </div>
  </div>

</body>
</html>
"""

def build_vendor_guide_pdf():
    target_path = os.environ.get("PDF_OUTPUT", OUTPUT_PDF_PATH)
    print(f"Building Executive Vendor & Agency Operating Manual PDF to: {target_path}...")

    # Write temporary HTML file
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(HTML_TEMPLATE)
        temp_html_path = f.name

    temp_pdf_path = os.path.join(tempfile.gettempdir(), f"globetrek_guide_{os.getpid()}.pdf")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Load local HTML file
            page.goto(f"file:///{os.path.abspath(temp_html_path)}", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1000)

            # Generate PDF with exact print background and A4 dimensions
            page.pdf(
                path=temp_pdf_path,
                format="A4",
                print_background=True,
                margin={
                    "top": "0mm",
                    "right": "0mm",
                    "bottom": "0mm",
                    "left": "0mm"
                },
                prefer_css_page_size=True,
            )

            browser.close()

            # Safely copy to target path
            import shutil
            try:
                shutil.copyfile(temp_pdf_path, target_path)
                print(f"Executive Vendor Guide PDF successfully saved to: {target_path} ({os.path.getsize(target_path):,} bytes)")
            except Exception as copy_err:
                fallback_target = "public/vendor-agency-manual.pdf"
                shutil.copyfile(temp_pdf_path, fallback_target)
                print(f"Original {target_path} is currently locked by a PDF reader. Saved to: {fallback_target} ({os.path.getsize(fallback_target):,} bytes)")
    finally:
        if os.path.exists(temp_html_path):
            os.remove(temp_html_path)
        if os.path.exists(temp_pdf_path):
            try:
                os.remove(temp_pdf_path)
            except:
                pass

if __name__ == "__main__":
    build_vendor_guide_pdf()

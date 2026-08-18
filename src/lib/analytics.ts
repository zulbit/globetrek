/**
 * Google Analytics (GA4) helper utilities for GlobeTrek PK
 * Measurement ID: G-EY3KWPZKVV
 */

export const GA_MEASUREMENT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GA_MEASUREMENT_ID) ||
  "G-EY3KWPZKVV";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/** Track custom GA4 event */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

/** Track SPA route navigation */
export function trackPageView(url: string, title?: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: title || document.title,
    });
  }
}

/** Track custom lead request submission (Tours or Visas) */
export function trackLeadSubmission(category: "tour" | "visa", details: Record<string, any> = {}) {
  trackEvent("generate_lead", {
    event_category: "Leads",
    lead_type: category,
    ...details,
  });
}

/** Track vendor unlocking a lead */
export function trackLeadUnlock(leadId: string, amountPkr: number) {
  trackEvent("unlock_lead", {
    event_category: "Monetization",
    lead_id: leadId,
    value: amountPkr,
    currency: "PKR",
  });
}

/** Track subscription upgrade or checkout */
export function trackSubscriptionCheckout(tier: string, pricePkr: number) {
  trackEvent("begin_checkout", {
    event_category: "Subscription",
    tier,
    value: pricePkr,
    currency: "PKR",
  });
}

/** Track WhatsApp inquiry clicks */
export function trackWhatsAppContact(vendorName: string, serviceType: string) {
  trackEvent("contact_vendor_whatsapp", {
    event_category: "Engagement",
    vendor_name: vendorName,
    service_type: serviceType,
  });
}

import { useEffect } from "react";

/**
 * Global component that intercepts ?ref=REFERRAL_CODE from any incoming URL,
 * stores it in localStorage & cookies, and auto-fills referral inputs across the site.
 */
export function VendorRefHandler() {
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref");
      if (refCode && refCode.trim()) {
        const cleanCode = refCode.trim().toUpperCase();
        // 1. Store in localStorage
        localStorage.setItem("globetrek_ref_code", cleanCode);
        // 2. Store in cookie for 30 days
        document.cookie = `globetrek_ref_code=${cleanCode}; max-age=${30 * 24 * 60 * 60}; path=/;`;
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  return null;
}

/**
 * Helper to retrieve active stored referral code if present
 */
export function getStoredReferralCode(): string | null {
  try {
    const local = localStorage.getItem("globetrek_ref_code");
    if (local && local.trim()) return local.trim().toUpperCase();

    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const [key, val] = c.trim().split("=");
      if (key === "globetrek_ref_code" && val) return val.trim().toUpperCase();
    }
  } catch {
    // Ignore
  }
  return null;
}

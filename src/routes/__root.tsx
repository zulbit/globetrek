import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/components/theme-provider";
import { AIChatWidget } from "@/components/AIChatWidget";
import { CompareBar } from "@/components/compare-bar";
import { VendorRefHandler } from "@/components/vendor-ref-handler";

const themeInitScript = `(function(){try{var t=localStorage.getItem('pk-tours-theme');var m=t==='light'?'light':'dark';document.documentElement.classList.add(m);document.documentElement.style.colorScheme=m;}catch(e){document.documentElement.classList.add('dark');}})();`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });

    const isChunkError =
      error?.message &&
      (error.message.includes("Failed to fetch dynamically imported module") ||
        error.message.includes("Importing a module script failed") ||
        error.message.includes("dynamically imported module") ||
        error.name === "ChunkLoadError");

    if (isChunkError && typeof window !== "undefined") {
      const key = "last_chunk_reload_time";
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem(key) || "0");
      if (now - lastReload > 10_000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
    }
  }, [error]);

  const handleTryAgain = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      router.invalidate();
      reset();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        {error?.message && (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-mono text-rose-300 text-left overflow-x-auto">
            {error.message}
          </div>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={handleTryAgain}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "GlobeTrek PK",
  url: "https://globetrek.pk",
  logo: "https://globetrek.pk/favicon.png",
  description: "Pakistan's premier B2B travel marketplace connecting tour operators, visa consultants, insurance brokers, and ticketing desks.",
  priceRange: "₨₨",
  currenciesAccepted: "PKR",
  areaServed: {
    "@type": "Country",
    name: "Pakistan",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "PK",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: "+923490386131",
    availableLanguage: ["English", "Urdu"],
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Travel Marketplace Services",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Tour Packages",
        description: "Domestic and international tour packages from verified Pakistani operators.",
      },
      {
        "@type": "OfferCatalog",
        name: "Visa Consultation",
        description: "Expert visa processing and embassy requirement consultations.",
      },
      {
        "@type": "OfferCatalog",
        name: "Travel Insurance",
        description: "Comprehensive international travel insurance policies priced in PKR.",
      },
      {
        "@type": "OfferCatalog",
        name: "Flight & Umrah Ticketing",
        description: "IATA ticketing desks and Umrah flight packages.",
      },
    ],
  },
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0B0F17" },
      { title: "GlobeTrek PK — Pakistan's First AI-Driven International Travel Platform" },
      {
        name: "description",
        content:
          "Book curated international tour packages, visas, travel insurance, and flight tickets from verified Pakistani vendors with AI travel concierge assistance.",
      },
      { name: "author", content: "GlobeTrek PK" },
      { property: "og:title", content: "GlobeTrek PK — Pakistan's First AI-Driven International Travel Platform" },
      {
        property: "og:description",
        content: "Verified Pakistani vendors, AI trip planner, transparent PKR pricing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globetrek.pk" },
      { property: "og:image", content: "https://globetrek.pk/og-image.jpg" },
      { property: "og:image:secure_url", content: "https://globetrek.pk/og-image.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "GlobeTrek PK — Pakistan's First AI-Driven International Travel Platform" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://globetrek.pk/og-image.jpg" },
      { name: "twitter:image:alt", content: "GlobeTrek PK — Pakistan's First AI-Driven International Travel Platform" },
    ],
    links: [
      { rel: "canonical", href: "https://globetrek.pk" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "shortcut icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
    scripts: [
      { children: themeInitScript },
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationSchema),
      },
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-EY3KWPZKVV",
        async: true,
      },
      {
        children: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-EY3KWPZKVV');`,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const fallbackQueryClient = new QueryClient();

function RootComponent() {
  const context = Route.useRouteContext();
  const queryClient = context?.queryClient || fallbackQueryClient;
  const router = useRouter();
  const { isImpersonating, impersonatedCompany } = useAuth();

  const handleExitImpersonation = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gtpk.impersonated_vendor_id");
      localStorage.removeItem("gtpk.impersonated_vendor_company");
      toast.success("Exited impersonation mode");
      window.location.href = "/admin/vendors";
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message || event.reason || "");
      if (
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("dynamically imported module")
      ) {
        event.preventDefault();
        const key = "chunk_err_reload";
        const last = Number(sessionStorage.getItem(key) || "0");
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
        }
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  // Track SPA route changes in Google Analytics (GA4)
  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
      (window as any).gtag("event", "page_view", {
        page_path: router.state.location.pathname,
        page_location: window.location.href,
        page_title: typeof document !== "undefined" ? document.title : "",
      });
    }
  }, [router.state.location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {isImpersonating && (
          <div className="sticky top-0 z-[9999] flex items-center justify-between bg-amber-500 px-4 py-2 text-xs font-bold text-black shadow-md">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-black/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                Impersonating
              </span>
              <span>Active Vendor context: {impersonatedCompany || "Unknown Agency"}</span>
            </div>
            <button
              onClick={handleExitImpersonation}
              className="rounded-lg bg-black px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-black/80 transition-colors"
            >
              Exit Impersonation
            </button>
          </div>
        )}
        <VendorRefHandler />
        <Outlet />
        <CompareBar />
        <AIChatWidget />
        <Toaster richColors position="top-right" theme="dark" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}


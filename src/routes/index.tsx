import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Hero } from "@/components/hero";
import { FeaturedTours } from "@/components/featured-tours";
import { LandingMapSection } from "@/components/landing-map-section";
import { ServicesStrip } from "@/components/services-strip";
import { Testimonials } from "@/components/testimonials";
import { ExclusiveSection } from "@/components/exclusive-section";
import { AffiliateCTASection } from "@/components/affiliate-cta";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "GlobeTrek PK — Pakistan's First AI-Driven International Travel Platform" },
      {
        name: "description",
        content:
          "Discover AI-planned international tour packages, visa services, travel insurance and flight tickets from Pakistan's verified travel vendors.",
      },
      { property: "og:title", content: "GlobeTrek PK — Pakistan's First AI-Driven International Travel Platform" },
      {
        property: "og:description",
        content:
          "Browse curated international tours to Turkey, Thailand, UAE, Europe and beyond with AI travel concierge assistance. All priced transparently in PKR.",
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
    ],
  }),
});

function Home() {
  return (
    <SiteShell>
      <Hero />
      <FeaturedTours />
      <LandingMapSection />
      <ExclusiveSection />
      <ServicesStrip />
      <AffiliateCTASection />
      <Testimonials />
    </SiteShell>
  );
}

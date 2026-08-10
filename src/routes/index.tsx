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
      { name: "twitter:card", content: "summary_large_image" },
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

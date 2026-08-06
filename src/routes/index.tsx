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
      { title: "GlobeTrek PK — International tours from Pakistan, priced in PKR" },
      {
        name: "description",
        content:
          "Discover international tour packages, visa services, travel insurance and flight tickets — all priced in PKR by Pakistan's verified travel vendors.",
      },
      { property: "og:title", content: "GlobeTrek PK — The world, priced in PKR" },
      {
        property: "og:description",
        content:
          "Browse curated international tours to Turkey, Thailand, UAE, Europe and beyond. Visas, insurance & tickets in one place.",
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
      <LandingMapSection />
      <FeaturedTours />
      <ExclusiveSection />
      <ServicesStrip />
      <AffiliateCTASection />
      <Testimonials />
    </SiteShell>
  );
}

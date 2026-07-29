import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { TOURS, type Tour, type Destination, type DepartureCity } from "@/lib/tours";
import { TourCard } from "@/components/tour-card";
import { getLandingCMSSettings } from "@/lib/cms.functions";
import europeImg from "@/assets/tour-europe.jpg";

type DbTour = {
  id: string;
  title: string;
  destination_country: string;
  departure_city: string | null;
  duration_days: number | null;
  price_pkr: number;
  total_seats: number | null;
  image_url: string | null;
};

function toTour(row: DbTour): Tour {
  const match = TOURS.find(
    (t) => t.title.toLowerCase() === row.title.toLowerCase() || t.destination === row.destination_country
  );
  const seats = row.total_seats ?? 20;
  return {
    id: row.id,
    title: row.title,
    destination: (row.destination_country as Destination) ?? "Europe",
    type: match?.type ?? "Cultural",
    image: row.image_url || match?.image || europeImg,
    durationDays: row.duration_days ?? match?.durationDays ?? 7,
    nights: (row.duration_days ?? match?.durationDays ?? 7) - 1,
    departureCity: ((row.departure_city as DepartureCity) || match?.departureCity || "Lahore") as DepartureCity,
    vendor: match?.vendor ?? "Verified Vendor",
    inclusions: match?.inclusions ?? ["Return flights", "Hotels", "Daily breakfast"],
    pricePKR: Number(row.price_pkr),
    seatsLeft: Math.max(1, Math.floor(seats * 0.4)),
    totalSeats: seats,
    rating: match?.rating ?? 4.8,
    reviews: match?.reviews ?? 120,
    summary: match?.summary ?? "",
    itinerary: match?.itinerary ?? [],
  };
}

export function FeaturedTours() {
  const getCmsFn = useServerFn(getLandingCMSSettings);

  const { data: cmsSettings } = useQuery({
    queryKey: ["landing-cms-settings"],
    queryFn: () => getCmsFn(),
  });

  const limit = cmsSettings?.featured_tours_limit ?? 8;
  const layoutMode = cmsSettings?.featured_tours_layout ?? "grid_4";
  const heading = cmsSettings?.featured_tours_heading || "Trending international departures";
  const subheading =
    cmsSettings?.featured_tours_subheading ||
    "Hand-picked experiences from verified Pakistani travel vendors — priced in PKR.";

  const { data: tours = [] } = useQuery({
    queryKey: ["featured-tours", limit],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const { data, error } = await supabase
          .from("tours")
          .select("id, title, destination_country, departure_city, duration_days, price_pkr, total_seats, image_url")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(limit)
          .abortSignal(controller.signal);
        clearTimeout(timer);
        if (error || !data || data.length === 0) return TOURS.slice(0, limit);
        return (data as DbTour[]).map(toTour);
      } catch {
        return TOURS.slice(0, limit);
      }
    },
    retry: false,
    placeholderData: TOURS.slice(0, limit),
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Featured tours
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {heading}
          </h2>
          <p className="text-sm text-muted-foreground">
            {subheading}
          </p>
        </div>
        <Link
          to="/tours"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          View all destinations →
        </Link>
      </div>

      {/* Render Grid vs Carousel based on CMS setting */}
      {layoutMode === "carousel" ? (
        <div className="mt-8 flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 scrollbar-none">
          {tours.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tours available yet.</p>
          ) : (
            tours.map((t) => (
              <div key={t.id} className="min-w-[280px] sm:min-w-[320px] shrink-0 snap-start">
                <TourCard tour={t} />
              </div>
            ))
          )}
        </div>
      ) : (
        <div
          className={`mt-8 grid gap-5 ${
            layoutMode === "grid_3"
              ? "sm:grid-cols-2 lg:grid-cols-3"
              : "sm:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          {tours.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tours available yet.</p>
          ) : (
            tours.map((t) => <TourCard key={t.id} tour={t} />)
          )}
        </div>
      )}
    </section>
  );
}

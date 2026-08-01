import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Plane, Star, Heart, GitCompare, Globe, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { Tour } from "@/lib/tours";
import { formatPKR } from "@/lib/tours";
import { useWishlist, useCompare, type TourSnapshot } from "@/hooks/use-tour-collections";

function seatTone(left: number, total: number) {
  const pct = left / total;
  if (left <= 3) return "border-destructive/40 bg-destructive/15 text-destructive-foreground";
  if (pct < 0.4) return "border-highlight/40 bg-highlight/15 text-highlight";
  return "border-primary/40 bg-primary/15 text-primary";
}

function toSnapshot(tour: Tour): Omit<TourSnapshot, "savedAt"> {
  return {
    id: tour.id,
    title: tour.title,
    image: tour.image,
    destination: tour.destination,
    type: tour.type,
    departureCity: tour.departureCity,
    durationDays: tour.durationDays,
    nights: tour.nights,
    pricePKR: tour.pricePKR,
    rating: tour.rating,
    reviews: tour.reviews,
    vendor: tour.vendor,
    inclusions: tour.inclusions,
    seatsLeft: tour.seatsLeft,
    totalSeats: tour.totalSeats,
  };
}

export function TourCard({ tour }: { tour: Tour }) {
  const wishlist = useWishlist();
  const compare = useCompare();
  const saved = wishlist.has(tour.id);
  const comparing = compare.has(tour.id);

  const onWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = wishlist.toggle(toSnapshot(tour));
    toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
  };

  const onCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = compare.toggle(toSnapshot(tour));
    if (res.full) {
      toast.error(`You can compare up to ${compare.max} tours. Remove one first.`);
      return;
    }
    toast.success(res.added ? "Added to compare" : "Removed from compare");
  };

  return (
    <Link
      to="/tours/$id"
      params={{ id: tour.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-glow"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={tour.image}
          alt={tour.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />

        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            {tour.type}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${seatTone(tour.seatsLeft, tour.totalSeats)}`}
          >
            {tour.seatsLeft} seats left
          </span>
        </div>

        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            type="button"
            onClick={onWish}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={saved}
            className={`grid size-9 place-items-center rounded-full border backdrop-blur transition ${
              saved
                ? "border-rose-400/60 bg-rose-500/25 text-rose-200"
                : "border-white/20 bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <Heart className={`size-4 ${saved ? "fill-rose-400 text-rose-300" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onCompare}
            aria-label={comparing ? "Remove from compare" : "Add to compare"}
            aria-pressed={comparing}
            className={`grid size-9 place-items-center rounded-full border backdrop-blur transition ${
              comparing
                ? "border-primary/70 bg-primary/25 text-primary"
                : "border-white/20 bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <GitCompare className="size-4" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-white/80">
              {tour.destination.includes("-") || tour.destination.toLowerCase().includes("multi") || tour.destination.includes(",") || tour.destination.toLowerCase() === "europe" ? (
                <>
                  <Globe className="size-3 text-emerald-400 animate-pulse" />
                  <span className="rounded bg-emerald-500/30 px-1 py-0.2 text-[8px] font-bold text-emerald-200 uppercase tracking-wider">Multi-Country</span>
                  <span className="truncate">{tour.destination}</span>
                </>
              ) : (
                <>
                  <MapPin className="size-3" /> {tour.destination}
                </>
              )}
            </div>
            <h3 className="mt-0.5 truncate text-base font-semibold">{tour.title}</h3>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-xs">
            <Star className="size-3 fill-highlight text-highlight" />
            {tour.rating}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {tour.durationDays}D / {tour.nights}N
          </span>
          <span className="inline-flex items-center gap-1">
            <Plane className="size-3.5" /> Flights from {tour.departureCity === "Lahore" ? "LHE" : tour.departureCity === "Karachi" ? "KHI" : "ISB"}
          </span>
          {tour.accommodation?.departure_date && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <CalendarDays className="size-3.5" /> Departs {new Date(tour.accommodation.departure_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          by <span className="font-medium text-foreground">{tour.vendor}</span>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {tour.inclusions.slice(0, 3).map((inc) => (
            <li
              key={inc}
              className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {inc}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              from
            </div>
            <div className="text-lg font-bold text-highlight tabular-nums">
              {formatPKR(tour.pricePKR)}
            </div>
          </div>
          <span className="rounded-md bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            View tour →
          </span>
        </div>
      </div>
    </Link>
  );
}

import { Clock, MapPin, Plane, Star, Globe } from "lucide-react";
import { TOURS, formatPKR, type Destination, type DepartureCity } from "@/lib/tours";
import europeImg from "@/assets/tour-europe.jpg";

export type PreviewInput = {
  title: string;
  destination_country: string;
  departure_city: string;
  duration_days: number;
  price_pkr: number;
  total_seats: number;
  image_url: string;
  is_active: boolean;
  vendor_label?: string;
};

function seatTone(left: number, total: number) {
  const pct = total > 0 ? left / total : 0;
  if (left <= 3) return "border-destructive/40 bg-destructive/15 text-destructive-foreground";
  if (pct < 0.4) return "border-highlight/40 bg-highlight/15 text-highlight";
  return "border-primary/40 bg-primary/15 text-primary";
}

export function TourPreviewCard({ input }: { input: PreviewInput }) {
  const match = TOURS.find(
    (t) =>
      t.title.toLowerCase() === input.title.toLowerCase() ||
      t.destination === (input.destination_country as Destination),
  );
  const seats = Math.max(1, Number(input.total_seats) || 20);
  const seatsLeft = Math.max(1, Math.floor(seats * 0.4));
  const days = Math.max(1, Number(input.duration_days) || 1);
  const image = input.image_url?.trim() || match?.image || europeImg;
  const inclusions = match?.inclusions ?? ["Return flights", "Hotels", "Daily breakfast"];
  const rating = match?.rating ?? 4.8;
  const type = match?.type ?? "Cultural";
  const departure = (input.departure_city as DepartureCity) || "Karachi";
  const departureCode =
    departure === "Lahore" ? "LHE" : departure === "Islamabad" ? "ISB" : "KHI";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {!input.is_active && (
        <div className="absolute right-3 top-3 z-10 rounded-full border border-border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Draft — hidden
        </div>
      )}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={input.title || "Tour preview"}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/70 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            {type}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${seatTone(seatsLeft, seats)}`}
          >
            {seatsLeft} seats left
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-white/80">
              {input.destination_country?.includes("-") || input.destination_country?.toLowerCase().includes("multi") || input.destination_country?.includes(",") || input.destination_country?.toLowerCase() === "europe" ? (
                <>
                  <Globe className="size-3 text-emerald-400 animate-pulse" />
                  <span className="rounded bg-emerald-500/30 px-1 py-0.2 text-[8px] font-bold text-emerald-200 uppercase tracking-wider">Multi-Country</span>
                  <span className="truncate">{input.destination_country}</span>
                </>
              ) : (
                <>
                  <MapPin className="size-3" /> {input.destination_country || "Destination"}
                </>
              )}
            </div>
            <h3 className="mt-0.5 truncate text-base font-semibold">
              {input.title || "Untitled tour"}
            </h3>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-xs">
            <Star className="size-3 fill-highlight text-highlight" />
            {rating}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> {days}D / {Math.max(0, days - 1)}N
          </span>
          <span className="inline-flex items-center gap-1">
            <Plane className="size-3.5" /> Flights from {departureCode}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          by <span className="font-medium text-foreground">{input.vendor_label || "Verified Vendor"}</span>
        </div>

        <ul className="flex flex-wrap gap-1.5">
          {inclusions.slice(0, 3).map((inc) => (
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
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">from</div>
            <div className="text-lg font-bold text-highlight tabular-nums">
              {formatPKR(Number(input.price_pkr) || 0)}
            </div>
          </div>
          <span className="rounded-md bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
            View tour →
          </span>
        </div>
      </div>
    </div>
  );
}

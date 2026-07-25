import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Check, Minus, Plane, Clock, Users, Star, GitCompare } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { useCompare, type TourSnapshot } from "@/hooks/use-tour-collections";
import { formatPKR } from "@/lib/tours";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Tours · GlobeTrek PK" },
      { name: "description", content: "Side-by-side comparison of international tour packages — price, inclusions, duration and departure city, all in PKR." },
      { property: "og:title", content: "Compare Tours · GlobeTrek PK" },
      { property: "og:description", content: "Side-by-side comparison of international tour packages — price, inclusions, duration and departure city, all in PKR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

const AIRPORT: Record<string, string> = { Lahore: "LHE", Karachi: "KHI", Islamabad: "ISB" };

function ComparePage() {
  const { items, remove, clear, max } = useCompare();

  if (items.length === 0) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <GitCompare className="mx-auto size-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Nothing to compare yet</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add up to {max} tours from any listing to see them side-by-side.
            </p>
            <Link
              to="/tours"
              className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse tours
            </Link>
          </div>
        </section>
      </SiteShell>
    );
  }

  // Highlight best price / longest / highest rated
  const cheapestId = items.reduce((a, b) => (a.pricePKR <= b.pricePKR ? a : b)).id;
  const longestId = items.reduce((a, b) => (a.durationDays >= b.durationDays ? a : b)).id;
  const topRatedId = items.reduce((a, b) => (a.rating >= b.rating ? a : b)).id;

  const allInclusions = Array.from(
    new Set(items.flatMap((t) => t.inclusions.map((i) => i.trim())).filter(Boolean)),
  );

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Compare</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              <GitCompare className="size-7 text-primary" />
              {items.length} tours side-by-side
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Prices in PKR · verified Pakistani vendors.
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" /> Clear all
          </button>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-40" />
              {items.map((t) => (
                <col key={t.id} />
              ))}
            </colgroup>

            {/* Header row with images / titles / remove */}
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card p-4 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tour
                </th>
                {items.map((t) => (
                  <TourHeader key={t.id} t={t} onRemove={() => remove(t.id)} />
                ))}
              </tr>
            </thead>

            <tbody className="[&_tr]:border-t [&_tr]:border-border">
              <Row label="Price (PKR)">
                {items.map((t) => (
                  <td
                    key={t.id}
                    className={`p-4 align-top text-base font-bold tabular-nums ${
                      t.id === cheapestId ? "text-highlight" : "text-foreground"
                    }`}
                  >
                    {formatPKR(t.pricePKR)}
                    {t.id === cheapestId && items.length > 1 && (
                      <div className="mt-1 inline-flex rounded-full bg-highlight/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-highlight">
                        Best price
                      </div>
                    )}
                  </td>
                ))}
              </Row>

              <Row label="Duration" icon={<Clock className="size-3.5" />}>
                {items.map((t) => (
                  <td key={t.id} className="p-4 align-top">
                    <div className="font-medium">
                      {t.durationDays}D / {t.nights}N
                    </div>
                    {t.id === longestId && items.length > 1 && (
                      <div className="mt-1 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Longest
                      </div>
                    )}
                  </td>
                ))}
              </Row>

              <Row label="Departure" icon={<Plane className="size-3.5" />}>
                {items.map((t) => (
                  <td key={t.id} className="p-4 align-top">
                    {t.departureCity}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({AIRPORT[t.departureCity] ?? t.departureCity})
                    </span>
                  </td>
                ))}
              </Row>

              <Row label="Type">
                {items.map((t) => (
                  <td key={t.id} className="p-4 align-top">
                    <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs">
                      {t.type}
                    </span>
                  </td>
                ))}
              </Row>

              <Row label="Rating" icon={<Star className="size-3.5" />}>
                {items.map((t) => (
                  <td key={t.id} className="p-4 align-top">
                    <div className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-highlight text-highlight" />
                      <span className="font-medium">{t.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({t.reviews})</span>
                    </div>
                    {t.id === topRatedId && items.length > 1 && (
                      <div className="mt-1 inline-flex rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                        Top rated
                      </div>
                    )}
                  </td>
                ))}
              </Row>

              <Row label="Seats left" icon={<Users className="size-3.5" />}>
                {items.map((t) => {
                  const scarce = t.seatsLeft <= 3;
                  return (
                    <td key={t.id} className="p-4 align-top">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          scarce
                            ? "bg-destructive/15 text-destructive-foreground"
                            : "bg-surface text-muted-foreground"
                        }`}
                      >
                        {t.seatsLeft} / {t.totalSeats}
                      </span>
                    </td>
                  );
                })}
              </Row>

              <Row label="Vendor">
                {items.map((t) => (
                  <td key={t.id} className="p-4 align-top text-sm">
                    {t.vendor}
                  </td>
                ))}
              </Row>

              <Row label="Inclusions">
                {items.map((t) => (
                  <td key={t.id} className="p-4 align-top">
                    <ul className="space-y-1.5">
                      {allInclusions.map((inc) => {
                        const has = t.inclusions.some(
                          (i) => i.trim().toLowerCase() === inc.toLowerCase(),
                        );
                        return (
                          <li
                            key={inc}
                            className={`flex items-start gap-1.5 text-xs ${
                              has ? "text-foreground" : "text-muted-foreground/60"
                            }`}
                          >
                            {has ? (
                              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                            ) : (
                              <Minus className="mt-0.5 size-3.5 shrink-0" />
                            )}
                            <span>{inc}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                ))}
              </Row>

              <tr>
                <td className="sticky left-0 z-10 bg-card p-4" />
                {items.map((t) => (
                  <td key={t.id} className="p-4">
                    <Link
                      to="/tours/$id"
                      params={{ id: t.id }}
                      className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      View tour →
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {items.length < max && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Add up to {max - items.length} more tour{max - items.length === 1 ? "" : "s"} from the{" "}
            <Link to="/tours" className="text-primary hover:underline">
              tours listing
            </Link>{" "}
            to strengthen your comparison.
          </p>
        )}
      </section>
    </SiteShell>
  );
}

function TourHeader({ t, onRemove }: { t: TourSnapshot; onRemove: () => void }) {
  return (
    <th className="min-w-[200px] p-4 text-left align-bottom">
      <div className="relative overflow-hidden rounded-lg border border-border">
        <img src={t.image} alt={t.title} className="h-24 w-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-background/90 text-foreground ring-1 ring-border hover:bg-background"
          aria-label={`Remove ${t.title}`}
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{t.title}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{t.destination}</div>
    </th>
  );
}

function Row({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <th className="sticky left-0 z-10 bg-card p-4 text-left align-top text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </th>
      {children}
    </tr>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { TOURS, DESTINATIONS } from "@/lib/tours";

export const Route = createFileRoute("/destinations")({
  head: () => ({
    meta: [
      { title: "Destinations · GlobeTrek PK" },
      { name: "description", content: "Explore international destinations — Turkey, Thailand, UAE, Singapore, Vietnam, Malaysia, UK and Europe." },
    ],
  }),
  component: DestinationsPage,
});

function DestinationsPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Destinations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Where in the world are you going?
        </h1>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((d) => {
            const sample = TOURS.find((t) => t.destination === d);
            const count = TOURS.filter((t) => t.destination === d).length;
            return (
              <Link
                key={d}
                to="/tours"
                search={{ destination: d } as never}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:border-border-strong hover:shadow-glow"
              >
                <div className="aspect-[16/11] overflow-hidden">
                  {sample && (
                    <img
                      src={sample.image}
                      alt={d}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-background/95 via-background/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <div>
                    <h2 className="text-lg font-semibold">{d}</h2>
                    <p className="text-xs text-muted-foreground">{count} package{count === 1 ? "" : "s"}</p>
                  </div>
                  <ArrowRight className="size-5 text-primary transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}

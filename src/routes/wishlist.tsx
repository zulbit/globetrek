import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Trash2, GitCompare, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { useWishlist, useCompare } from "@/hooks/use-tour-collections";
import { formatPKR } from "@/lib/tours";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist · GlobeTrek PK" },
      { name: "description", content: "Your saved international tour packages, ready to book when you are." },
      { property: "og:title", content: "Your Wishlist · GlobeTrek PK" },
      { property: "og:description", content: "Your saved international tour packages, ready to book when you are." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const wishlist = useWishlist();
  const compare = useCompare();

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Saved for later
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              <Heart className="size-7 fill-rose-400 text-rose-300" />
              Your Wishlist
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {wishlist.items.length} saved tour{wishlist.items.length === 1 ? "" : "s"} · stored on this device
            </p>
          </div>
          {wishlist.items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                wishlist.clear();
                toast.success("Wishlist cleared");
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-3.5" /> Clear all
            </button>
          )}
        </header>

        {wishlist.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Heart className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Nothing saved yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any tour card to save it here for later.
            </p>
            <Link
              to="/tours"
              className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse tours
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.items
              .slice()
              .sort((a, b) => b.savedAt - a.savedAt)
              .map((t) => {
                const inCompare = compare.has(t.id);
                return (
                  <li
                    key={t.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                  >
                    <Link
                      to="/tours/$id"
                      params={{ id: t.id }}
                      className="block"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={t.image}
                          alt={t.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/70 to-transparent" />
                        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                          {t.type}
                        </span>
                        <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[11px] text-white/85">
                          <MapPin className="size-3" /> {t.destination}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="truncate text-sm font-semibold">{t.title}</h3>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {t.durationDays}D / {t.nights}N · {t.departureCity}
                        </p>
                        <p className="mt-2 text-base font-bold text-highlight tabular-nums">
                          {formatPKR(t.pricePKR)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 border-t border-border p-2">
                      <button
                        type="button"
                        onClick={() => {
                          const res = compare.toggle(t);
                          if (res.full) {
                            toast.error(`You can compare up to ${compare.max} tours.`);
                            return;
                          }
                          toast.success(res.added ? "Added to compare" : "Removed from compare");
                        }}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                          inCompare
                            ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                            : "bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <GitCompare className="size-3.5" />
                        {inCompare ? "In compare" : "Compare"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          wishlist.remove(t.id);
                          toast.success("Removed from wishlist");
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-surface hover:text-foreground"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}

import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { formatPKR } from "@/lib/services";

type CardProps = {
  to: string;
  params: Record<string, string>;
  image_url?: string | null;
  fallback: string; // gradient class
  category: string;
  categoryTone: string; // e.g. text-sky-400
  title: string;
  subtitle: string;
  meta: { label: string; value: string }[];
  price_pkr?: number;
  priceHint?: string;
  city?: string | null;
  preview?: ReactNode;
};


export function ServiceListCard(p: CardProps) {
  return (
    <Link
      to={p.to as never}
      params={p.params as never}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
    >
      <div className={`relative aspect-[16/10] w-full overflow-hidden ${p.image_url ? "" : p.fallback}`}>
        {p.image_url && (
          <img
            src={p.image_url}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className={`absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur ${p.categoryTone}`}>
          {p.category}
        </div>
        {p.preview && (
          <div className="absolute right-3 top-3">{p.preview}</div>
        )}
        {p.city && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur">
            <MapPin className="size-3" /> {p.city}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold leading-snug">{p.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{p.subtitle}</p>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface/60 p-3">
          {p.meta.map((m) => (
            <div key={m.label} className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
              <div className="truncate text-xs font-semibold">{m.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between">
          <div>
            {typeof p.price_pkr === "number" && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.priceHint ?? "Starting from"}
                </div>
                <div className="text-lg font-bold text-highlight">{formatPKR(p.price_pkr)}</div>
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-80 transition group-hover:opacity-100">
            View <ArrowRight className="size-3.5" />
          </span>
        </div>

      </div>
    </Link>
  );
}

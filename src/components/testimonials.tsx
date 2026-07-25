import { Star, Quote } from "lucide-react";

type Testimonial = {
  name: string;
  city: string;
  tour: string;
  rating: number;
  quote: string;
  initials: string;
  accent: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Ayesha Malik",
    city: "Lahore",
    tour: "7-Day Turkey Explorer",
    rating: 5,
    quote:
      "Cappadocia balloons at sunrise were unreal. GlobeTrek PK handled visas, flights from LHE, and hotels — I just packed and showed up.",
    initials: "AM",
    accent: "from-emerald-500/30 to-emerald-500/5",
  },
  {
    name: "Bilal Ahmed",
    city: "Karachi",
    tour: "5-Day Bangkok Getaway",
    rating: 5,
    quote:
      "Priced entirely in PKR — no surprise FX charges. Vendor was verified and responded on WhatsApp within minutes. Booked Phuket next.",
    initials: "BA",
    accent: "from-amber-500/30 to-amber-500/5",
  },
  {
    name: "Sana Qureshi",
    city: "Islamabad",
    tour: "6-Day Dubai + Abu Dhabi",
    rating: 5,
    quote:
      "The inquiry-to-booking flow was refreshingly simple. Compared three vendors side-by-side and picked one my cousin had used last year.",
    initials: "SQ",
    accent: "from-sky-500/30 to-sky-500/5",
  },
  {
    name: "Hamza Raza",
    city: "Lahore",
    tour: "8-Day Europe Highlights",
    rating: 4,
    quote:
      "Schengen paperwork guidance alone was worth it. Paris, Amsterdam, Zurich — every transfer on time. Would recommend to any first-timer.",
    initials: "HR",
    accent: "from-violet-500/30 to-violet-500/5",
  },
  {
    name: "Fatima Sheikh",
    city: "Karachi",
    tour: "5-Day Singapore Family",
    rating: 5,
    quote:
      "Traveled with two kids under 10. Vendor arranged Universal + S.E.A. Aquarium tickets in advance. Zero queues, zero stress.",
    initials: "FS",
    accent: "from-rose-500/30 to-rose-500/5",
  },
  {
    name: "Usman Tariq",
    city: "Islamabad",
    tour: "6-Day Vietnam Discovery",
    rating: 5,
    quote:
      "Ha Long Bay cruise was the highlight of my year. Transparent PKR pricing meant I knew exactly what I was paying, upfront.",
    initials: "UT",
    accent: "from-teal-500/30 to-teal-500/5",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:py-20">
      <div className="mb-10 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Traveler stories
          </div>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Loved by travelers across Pakistan
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Real reviews from customers who booked international trips through verified GlobeTrek PK vendors.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-highlight text-highlight" />
            ))}
          </div>
          <div className="text-sm">
            <div className="font-semibold tabular-nums">4.9 / 5</div>
            <div className="text-[11px] text-muted-foreground">2,400+ reviews</div>
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.slice(0, 3).map((t) => (
          <li
            key={t.name}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-glow"
          >
            <div
              className={`pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-linear-to-br ${t.accent} blur-2xl`}
            />
            <Quote className="size-6 text-primary/60" />
            <div className="mt-3 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < t.rating
                      ? "size-3.5 fill-highlight text-highlight"
                      : "size-3.5 text-muted-foreground/30"
                  }
                />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-foreground">
                {t.initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{t.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {t.city} · {t.tour}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

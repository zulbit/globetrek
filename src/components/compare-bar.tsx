import { Link } from "@tanstack/react-router";
import { GitCompare, X } from "lucide-react";
import { useCompare } from "@/hooks/use-tour-collections";

export function CompareBar() {
  const { items, remove, clear, max } = useCompare();
  if (items.length === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-40 md:bottom-4 pointer-events-none"
      aria-label="Tour compare tray"
    >
      <div className="mx-auto max-w-3xl px-3">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-primary/40 bg-background/95 p-2 pl-3 shadow-glow backdrop-blur">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <GitCompare className="size-4" />
            Compare
          </div>
          <ul className="flex flex-1 items-center gap-2 overflow-x-auto">
            {items.map((t) => (
              <li
                key={t.id}
                className="group relative shrink-0 overflow-hidden rounded-lg border border-border"
              >
                <img src={t.image} alt={t.title} className="h-10 w-16 object-cover" />
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-background text-foreground shadow ring-1 ring-border"
                  aria-label={`Remove ${t.title} from compare`}
                >
                  <X className="size-2.5" />
                </button>
              </li>
            ))}
            {Array.from({ length: Math.max(0, max - items.length) }).map((_, i) => (
              <li
                key={`slot-${i}`}
                className="h-10 w-16 shrink-0 rounded-lg border border-dashed border-border/60 bg-surface/40"
              />
            ))}
          </ul>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={clear}
              className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              Clear
            </button>
            <Link
              to="/compare"
              disabled={items.length < 2}
              aria-disabled={items.length < 2}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                items.length < 2
                  ? "cursor-not-allowed bg-surface text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              Compare {items.length}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

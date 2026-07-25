import * as React from "react";

/**
 * Minimal snapshot of a tour we persist for wishlist / compare so the
 * feature works offline and across sessions without a round-trip.
 */
export type TourSnapshot = {
  id: string;
  title: string;
  image: string;
  destination: string;
  type: string;
  departureCity: string;
  durationDays: number;
  nights: number;
  pricePKR: number;
  rating: number;
  reviews: number;
  vendor: string;
  inclusions: string[];
  seatsLeft: number;
  totalSeats: number;
  savedAt: number;
};

const WISHLIST_KEY = "gtpk.wishlist.v1";
const COMPARE_KEY = "gtpk.compare.v1";
export const COMPARE_MAX = 3;

type Listener = () => void;

function readStore(key: string): TourSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TourSnapshot[]) : [];
  } catch {
    return [];
  }
}

function writeStore(key: string, value: TourSnapshot[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createCollection(key: string, opts?: { max?: number }) {
  const listeners = new Set<Listener>();
  const emit = () => listeners.forEach((l) => l());

  const subscribe = (cb: Listener) => {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) cb();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };

  const get = () => readStore(key);

  const set = (next: TourSnapshot[]) => {
    let value = next;
    if (opts?.max && value.length > opts.max) value = value.slice(-opts.max);
    writeStore(key, value);
    emit();
  };

  return { subscribe, get, set };
}

const wishlistStore = createCollection(WISHLIST_KEY);
const compareStore = createCollection(COMPARE_KEY, { max: COMPARE_MAX });

function useCollection(store: ReturnType<typeof createCollection>) {
  // SSR-safe: start empty, hydrate on mount to avoid mismatch.
  const [items, setItems] = React.useState<TourSnapshot[]>([]);
  React.useEffect(() => {
    setItems(store.get());
    return store.subscribe(() => setItems(store.get()));
  }, [store]);
  return items;
}

export function useWishlist() {
  const items = useCollection(wishlistStore);

  const has = React.useCallback((id: string) => items.some((t) => t.id === id), [items]);

  const toggle = React.useCallback((tour: Omit<TourSnapshot, "savedAt">) => {
    const current = wishlistStore.get();
    const exists = current.some((t) => t.id === tour.id);
    if (exists) {
      wishlistStore.set(current.filter((t) => t.id !== tour.id));
      return false;
    }
    wishlistStore.set([...current, { ...tour, savedAt: Date.now() }]);
    return true;
  }, []);

  const remove = React.useCallback((id: string) => {
    wishlistStore.set(wishlistStore.get().filter((t) => t.id !== id));
  }, []);

  const clear = React.useCallback(() => wishlistStore.set([]), []);

  return { items, has, toggle, remove, clear };
}

export function useCompare() {
  const items = useCollection(compareStore);

  const has = React.useCallback((id: string) => items.some((t) => t.id === id), [items]);
  const isFull = items.length >= COMPARE_MAX;

  const toggle = React.useCallback(
    (tour: Omit<TourSnapshot, "savedAt">): { added: boolean; full: boolean } => {
      const current = compareStore.get();
      const exists = current.some((t) => t.id === tour.id);
      if (exists) {
        compareStore.set(current.filter((t) => t.id !== tour.id));
        return { added: false, full: false };
      }
      if (current.length >= COMPARE_MAX) {
        return { added: false, full: true };
      }
      compareStore.set([...current, { ...tour, savedAt: Date.now() }]);
      return { added: true, full: false };
    },
    [],
  );

  const remove = React.useCallback((id: string) => {
    compareStore.set(compareStore.get().filter((t) => t.id !== id));
  }, []);

  const clear = React.useCallback(() => compareStore.set([]), []);

  return { items, has, toggle, remove, clear, isFull, max: COMPARE_MAX };
}

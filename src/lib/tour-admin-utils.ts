import Papa from "papaparse";
import type { ItineraryDay } from "@/lib/tours";

// ---- Itinerary schema versioning
// v1: stored as { version: 1, days: ItineraryDay[] }
// legacy (unversioned): stored as ItineraryDay[]
export const ITINERARY_SCHEMA_VERSION = 1 as const;

export type VersionedItinerary = {
  version: number;
  days: ItineraryDay[];
};

function coerceActivities(raw: unknown): { time: string; title: string }[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw
    .map((a) => {
      const o = (a ?? {}) as { time?: unknown; title?: unknown };
      return { time: String(o.time ?? "").trim(), title: String(o.title ?? "").trim() };
    })
    .filter((a) => a.time || a.title);
  return out.length ? out : undefined;
}

function coerceDays(arr: unknown[]): ItineraryDay[] {
  return arr.map((d, i) => {
    const o = (d ?? {}) as Record<string, unknown>;
    return {
      day: Number(o.day ?? i + 1),
      title: String(o.title ?? ""),
      detail: String(o.detail ?? ""),
      activities: coerceActivities(o.activities),
    };
  });
}

export function normalizeItinerary(raw: unknown): ItineraryDay[] {
  if (!raw) return [];
  if (typeof raw === "object" && !Array.isArray(raw) && raw !== null && "days" in raw) {
    const days = (raw as { days: unknown }).days;
    if (Array.isArray(days)) return coerceDays(days);
  }
  if (Array.isArray(raw)) return coerceDays(raw);
  return [];
}

export function wrapItinerary(days: ItineraryDay[]): VersionedItinerary {
  return {
    version: ITINERARY_SCHEMA_VERSION,
    days: days
      .map((d, i) => {
        const activities = (d.activities ?? [])
          .map((a) => ({ time: (a.time ?? "").trim(), title: (a.title ?? "").trim() }))
          .filter((a) => a.time || a.title);
        return {
          day: i + 1,
          title: d.title.trim(),
          detail: d.detail.trim(),
          ...(activities.length ? { activities } : {}),
        };
      })
      .filter((d) => d.title || d.detail || (d.activities?.length ?? 0) > 0),
  };
}


// ---- Image optimization: downscale to max 1600px, encode as JPEG 0.82
export async function optimizeImage(
  file: File,
  { maxDim = 1600, quality = 0.82 }: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", quality),
  );
  if (!blob) return file;
  // Only use optimized version if it's actually smaller
  if (blob.size >= file.size && scale === 1) return file;
  const base = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

// ---- Itinerary validation
export type ItineraryIssue = { index: number; message: string };

export function validateItinerary(
  itinerary: ItineraryDay[],
  opts: { durationDays: number; requireForPublish: boolean },
): { issues: ItineraryIssue[]; error?: string } {
  const issues: ItineraryIssue[] = [];
  const filled = itinerary.filter((d) => d.title.trim() || d.detail.trim());

  if (opts.requireForPublish && filled.length === 0) {
    return { issues, error: "Add at least one itinerary day before publishing." };
  }
  itinerary.forEach((d, i) => {
    const hasDetail = d.detail.trim().length > 0;
    const hasTitle = d.title.trim().length > 0;
    if (hasDetail && !hasTitle) {
      issues.push({ index: i, message: "Title is required when details are provided." });
    }
    if (hasTitle && d.title.trim().length > 120) {
      issues.push({ index: i, message: "Title must be 120 characters or fewer." });
    }
    if (d.detail.trim().length > 800) {
      issues.push({ index: i, message: "Details must be 800 characters or fewer." });
    }
  });
  if (filled.length > 0 && filled.length !== opts.durationDays) {
    return {
      issues,
      error: `Itinerary has ${filled.length} day${filled.length === 1 ? "" : "s"} but duration is ${opts.durationDays}. Use Auto-fill to match.`,
    };
  }
  if (issues.length > 0) {
    return { issues, error: `Fix ${issues.length} itinerary issue${issues.length === 1 ? "" : "s"} to save.` };
  }
  return { issues };
}

// ---- CSV import / export
export type CsvTourRow = {
  id?: string;
  title: string;
  description: string;
  destination_country: string;
  departure_city: string;
  duration_days: number;
  price_pkr: number;
  total_seats: number;
  image_url: string;
  is_active: boolean;
  vendor_id?: string;
  itinerary_json: string;
};

const CSV_COLUMNS: (keyof CsvTourRow)[] = [
  "id", "title", "description", "destination_country", "departure_city",
  "duration_days", "price_pkr", "total_seats", "image_url", "is_active",
  "vendor_id", "itinerary_json",
];

export function toursToCSV(
  rows: Array<{
    id: string; title: string; description: string; destination_country: string;
    departure_city: string; duration_days: number; price_pkr: number;
    total_seats: number; image_url: string | null; is_active: boolean;
    vendor_id: string; itinerary: ItineraryDay[] | null;
  }>,
): string {
  const data = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    destination_country: r.destination_country,
    departure_city: r.departure_city,
    duration_days: r.duration_days,
    price_pkr: r.price_pkr,
    total_seats: r.total_seats,
    image_url: r.image_url ?? "",
    is_active: r.is_active,
    vendor_id: r.vendor_id,
    itinerary_json: JSON.stringify(r.itinerary ?? []),
  }));
  return Papa.unparse(data, { columns: CSV_COLUMNS });
}

export type ParsedCsvRow = {
  id?: string;
  title: string;
  description: string;
  destination_country: string;
  departure_city: string;
  duration_days: number;
  price_pkr: number;
  total_seats: number;
  image_url: string;
  is_active: boolean;
  vendor_id?: string;
  itinerary: ItineraryDay[];
};

export type ParsedCsv = {
  valid: ParsedCsvRow[];
  errors: string[];
};

export function parseToursCSV(text: string): ParsedCsv {
  const errors: string[] = [];
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length) {
    for (const e of result.errors.slice(0, 5)) errors.push(`Row ${e.row}: ${e.message}`);
  }
  const valid: ParsedCsv["valid"] = [];
  (result.data ?? []).forEach((raw, i) => {
    const line = i + 2; // header + 1-idx
    const title = (raw.title ?? "").trim();
    if (!title) {
      errors.push(`Row ${line}: title is required.`);
      return;
    }
    const duration = Number(raw.duration_days);
    const price = Number(raw.price_pkr);
    const seats = Number(raw.total_seats);
    if (!Number.isFinite(duration) || duration < 1) {
      errors.push(`Row ${line}: duration_days must be ≥ 1.`);
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      errors.push(`Row ${line}: price_pkr must be ≥ 0.`);
      return;
    }
    if (!Number.isFinite(seats) || seats < 1) {
      errors.push(`Row ${line}: total_seats must be ≥ 1.`);
      return;
    }
    let itinerary: ItineraryDay[] = [];
    const iRaw = (raw.itinerary_json ?? "").trim();
    if (iRaw) {
      try {
        const parsed = JSON.parse(iRaw);
        if (Array.isArray(parsed)) {
          itinerary = parsed.map((d, idx) => ({
            day: Number(d?.day ?? idx + 1),
            title: String(d?.title ?? ""),
            detail: String(d?.detail ?? ""),
          }));
        }
      } catch {
        errors.push(`Row ${line}: itinerary_json is not valid JSON.`);
      }
    }
    const activeRaw = (raw.is_active ?? "").toString().trim().toLowerCase();
    const is_active = activeRaw === "true" || activeRaw === "1" || activeRaw === "yes";
    valid.push({
      id: (raw.id ?? "").trim() || undefined,
      title,
      description: (raw.description ?? "").trim(),
      destination_country: (raw.destination_country ?? "").trim(),
      departure_city: (raw.departure_city ?? "").trim(),
      duration_days: duration,
      price_pkr: price,
      total_seats: seats,
      image_url: (raw.image_url ?? "").trim(),
      is_active,
      vendor_id: (raw.vendor_id ?? "").trim() || undefined,
      itinerary,
    });
  });
  return { valid, errors };
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

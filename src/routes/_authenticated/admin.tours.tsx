import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Search, X,
  Upload, GripVertical, ArrowUp, ArrowDown, ImageIcon,
  Download, FileSpreadsheet, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR, type ItineraryDay } from "@/lib/tours";
import {
  optimizeImage, validateItinerary, toursToCSV, parseToursCSV, downloadCSV,
  normalizeItinerary,
  type ItineraryIssue, type ParsedCsvRow,
} from "@/lib/tour-admin-utils";
import { saveTourServer, setTourPublishedServer } from "@/lib/tours.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TourPreviewCard } from "@/components/tour-preview-card";

export const Route = createFileRoute("/_authenticated/admin/tours")({
  component: AdminTours,
});

type TourRow = {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  destination_country: string;
  departure_city: string;
  duration_days: number;
  price_pkr: number;
  total_seats: number;
  image_url: string | null;
  is_active: boolean;
  itinerary: ItineraryDay[] | null;
  profiles?: { full_name: string | null; company_name: string | null } | null;
};

type VendorOption = { id: string; label: string };

const DESTINATIONS = [
  "Turkey", "Thailand", "UAE", "Saudi Arabia", "Malaysia", "Singapore", "Vietnam", "Maldives",
  "Azerbaijan", "UK", "USA", "Canada", "Europe", "Switzerland", "Germany", "France", "Italy",
  "Spain", "Japan", "China", "Australia", "Indonesia", "Sri Lanka", "Egypt", "Kenya", "South Africa",
  "Qatar", "Bahrain", "Oman", "Kuwait"
];
const DEPARTURE_CITIES = ["Karachi", "Lahore", "Islamabad"];

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // ~5 years

type FormState = {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  destination_country: string;
  departure_city: string;
  duration_days: number;
  price_pkr: number;
  total_seats: number;
  image_url: string;
  is_active: boolean;
  itinerary: ItineraryDay[];
};

const emptyForm: FormState = {
  id: "",
  vendor_id: "",
  title: "",
  description: "",
  destination_country: "Turkey",
  departure_city: "Karachi",
  duration_days: 7,
  price_pkr: 250000,
  total_seats: 20,
  image_url: "",
  is_active: true,
  itinerary: [],
};

function AdminTours() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [importPreview, setImportPreview] = useState<{ rows: ParsedCsvRow[]; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bulkProgress, setBulkProgress] = useState<{
    action: "publish" | "unpublish" | "delete";
    done: number;
    total: number;
    failed: number;
  } | null>(null);

  const saveTourFn = useServerFn(saveTourServer);
  const setPublishedFn = useServerFn(setTourPublishedServer);

  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["admin-tours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, vendor_id, title, description, destination_country, departure_city, duration_days, price_pkr, total_seats, image_url, is_active, itinerary, profiles:profiles!tours_vendor_id_fkey(full_name, company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TourRow[];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["admin-vendor-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, company_name, email")
        .order("company_name", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        label: p.company_name || p.full_name || p.email || p.id.slice(0, 8),
      })) as VendorOption[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-tours"] });
    qc.invalidateQueries({ queryKey: ["featured-tours"] });
    qc.invalidateQueries({ queryKey: ["tours"] });
  };

  const destinationOptions = useMemo(
    () => Array.from(new Set(tours.map((t) => t.destination_country))).sort(),
    [tours],
  );

  const filteredTours = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tours.filter((t) => {
      if (destinationFilter !== "all" && t.destination_country !== destinationFilter) return false;
      if (vendorFilter !== "all" && t.vendor_id !== vendorFilter) return false;
      if (statusFilter === "published" && !t.is_active) return false;
      if (statusFilter === "draft" && t.is_active) return false;
      if (q) {
        const hay = [
          t.title, t.destination_country, t.departure_city,
          t.profiles?.company_name ?? "", t.profiles?.full_name ?? "",
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tours, search, destinationFilter, vendorFilter, statusFilter]);

  const hasActiveFilters =
    search !== "" || destinationFilter !== "all" || vendorFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch(""); setDestinationFilter("all"); setVendorFilter("all"); setStatusFilter("all");
  };

  // ---- Bulk selection helpers
  const visibleIds = useMemo(() => filteredTours.map((t) => t.id), [filteredTours]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someVisibleSelected = visibleIds.some((id) => selected.has(id));
  const selectedCount = selected.size;

  const toggleOne = (id: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  };
  const toggleAllVisible = (on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (on) next.add(id); else next.delete(id);
      }
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  // ---- Mutations
  const saveMutation = useMutation({
    mutationFn: async (form: FormState) => {
      // Client-side pre-check for fast feedback (server re-validates)
      const validation = validateItinerary(form.itinerary, {
        durationDays: Number(form.duration_days) || 1,
        requireForPublish: form.is_active,
      });
      if (validation.error) throw new Error(validation.error);

      return saveTourFn({
        data: {
          id: form.id || undefined,
          vendor_id: form.vendor_id,
          title: form.title,
          description: form.description,
          destination_country: form.destination_country,
          departure_city: form.departure_city,
          duration_days: Number(form.duration_days),
          price_pkr: Number(form.price_pkr),
          total_seats: Number(form.total_seats),
          image_url: form.image_url,
          is_active: form.is_active,
          itinerary: form.itinerary,
        },
      });
    },
    onSuccess: () => {
      toast.success(editing?.id ? "Tour updated" : "Tour created");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("tours").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, is_active }) => {
      await qc.cancelQueries({ queryKey: ["admin-tours"] });
      const prev = qc.getQueryData<TourRow[]>(["admin-tours"]);
      qc.setQueryData<TourRow[]>(["admin-tours"], (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, is_active } : t)),
      );
      return { prev };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-tours"], ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tours").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin-tours"] });
      const prev = qc.getQueryData<TourRow[]>(["admin-tours"]);
      qc.setQueryData<TourRow[]>(["admin-tours"], (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
      return { prev };
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-tours"], ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => {
      toast.success("Tour deleted");
      setDeleteId(null);
      invalidate();
    },
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      const prev = qc.getQueryData<TourRow[]>(["admin-tours"]) ?? [];
      const prevById = new Map(prev.map((t) => [t.id, t]));

      // Optimistic: flip is_active immediately in cache
      qc.setQueryData<TourRow[]>(["admin-tours"], (old) =>
        (old ?? []).map((t) => (ids.includes(t.id) ? { ...t, is_active } : t)),
      );

      setBulkProgress({
        action: is_active ? "publish" : "unpublish",
        done: 0,
        total: ids.length,
        failed: 0,
      });
      const failedIds: string[] = [];
      for (let i = 0; i < ids.length; i++) {
        try {
          await setPublishedFn({ data: { id: ids[i], is_active } });
        } catch {
          failedIds.push(ids[i]);
        }
        setBulkProgress((p) => (p ? { ...p, done: i + 1, failed: failedIds.length } : p));
      }

      // Roll back only failed items
      if (failedIds.length > 0) {
        qc.setQueryData<TourRow[]>(["admin-tours"], (old) =>
          (old ?? []).map((t) => (failedIds.includes(t.id) ? prevById.get(t.id) ?? t : t)),
        );
      }

      return { total: ids.length, failed: failedIds.length };
    },
    onSuccess: (res, vars) => {
      const ok = res.total - res.failed;
      if (res.failed === 0) {
        toast.success(`${ok} tour${ok === 1 ? "" : "s"} ${vars.is_active ? "published" : "unpublished"}`);
      } else {
        toast.warning(`${ok}/${res.total} ${vars.is_active ? "published" : "unpublished"} — ${res.failed} failed`);
      }
      clearSelection();
      invalidate();
    },
    onError: (e: Error) => {
      qc.invalidateQueries({ queryKey: ["admin-tours"] });
      toast.error(e.message);
    },
    onSettled: () => setTimeout(() => setBulkProgress(null), 800),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const prev = qc.getQueryData<TourRow[]>(["admin-tours"]) ?? [];
      const removed = prev.filter((t) => ids.includes(t.id));

      // Optimistic remove
      qc.setQueryData<TourRow[]>(["admin-tours"], (old) =>
        (old ?? []).filter((t) => !ids.includes(t.id)),
      );

      setBulkProgress({ action: "delete", done: 0, total: ids.length, failed: 0 });
      const failedIds: string[] = [];
      for (let i = 0; i < ids.length; i++) {
        const { error } = await supabase.from("tours").delete().eq("id", ids[i]);
        if (error) failedIds.push(ids[i]);
        setBulkProgress((p) => (p ? { ...p, done: i + 1, failed: failedIds.length } : p));
      }

      // Reinsert failed rows
      if (failedIds.length > 0) {
        const failedRows = removed.filter((t) => failedIds.includes(t.id));
        qc.setQueryData<TourRow[]>(["admin-tours"], (old) => [...failedRows, ...(old ?? [])]);
      }

      return { total: ids.length, failed: failedIds.length };
    },
    onSuccess: (res) => {
      const ok = res.total - res.failed;
      if (res.failed === 0) {
        toast.success(`${ok} tour${ok === 1 ? "" : "s"} deleted`);
      } else {
        toast.warning(`${ok}/${res.total} deleted — ${res.failed} failed`);
      }
      clearSelection();
      setBulkDeleteOpen(false);
      invalidate();
    },
    onError: (e: Error) => {
      qc.invalidateQueries({ queryKey: ["admin-tours"] });
      toast.error(e.message);
    },
    onSettled: () => setTimeout(() => setBulkProgress(null), 800),
  });

  // ---- Image upload (optimized → private bucket → long-lived signed URL)
  const handleImageUpload = async (raw: File) => {
    if (!editing) return;
    if (!raw.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (raw.size > 20 * 1024 * 1024) {
      toast.error("Max image size is 20MB (pre-optimization).");
      return;
    }
    setUploading(true);
    try {
      const file = await optimizeImage(raw, { maxDim: 1600, quality: 0.82 });
      const savedKb = Math.max(0, Math.round((raw.size - file.size) / 1024));
      const ext = file.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "jpg");
      const path = `tours/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("tour-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("tour-images")
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (signErr) throw signErr;
      setEditing({ ...editing, image_url: signed.signedUrl });
      toast.success(savedKb > 20 ? `Image uploaded (saved ${savedKb} KB)` : "Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ---- Itinerary editor helpers
  const addDay = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      itinerary: [
        ...editing.itinerary,
        { day: editing.itinerary.length + 1, title: "", detail: "" },
      ],
    });
  };
  const updateDay = (idx: number, patch: Partial<ItineraryDay>) => {
    if (!editing) return;
    const next = editing.itinerary.map((d, i) => (i === idx ? { ...d, ...patch } : d));
    setEditing({ ...editing, itinerary: next });
  };
  const removeDay = (idx: number) => {
    if (!editing) return;
    const next = editing.itinerary
      .filter((_, i) => i !== idx)
      .map((d, i) => ({ ...d, day: i + 1 }));
    setEditing({ ...editing, itinerary: next });
  };
  const moveDay = (idx: number, dir: -1 | 1) => {
    if (!editing) return;
    const target = idx + dir;
    if (target < 0 || target >= editing.itinerary.length) return;
    const next = [...editing.itinerary];
    [next[idx], next[target]] = [next[target], next[idx]];
    setEditing({ ...editing, itinerary: next.map((d, i) => ({ ...d, day: i + 1 })) });
  };
  const autofillDays = () => {
    if (!editing) return;
    const n = Math.max(1, Number(editing.duration_days) || 1);
    const existing = editing.itinerary;
    const next: ItineraryDay[] = Array.from({ length: n }, (_, i) => ({
      day: i + 1,
      title: existing[i]?.title ?? `Day ${i + 1}`,
      detail: existing[i]?.detail ?? "",
    }));
    setEditing({ ...editing, itinerary: next });
  };

  // ---- Drag-and-drop reorder
  const reorderTo = (from: number, to: number) => {
    if (!editing || from === to) return;
    const next = [...editing.itinerary];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setEditing({ ...editing, itinerary: next.map((d, i) => ({ ...d, day: i + 1 })) });
  };

  // ---- Validation surface
  const itineraryValidation = useMemo(() => {
    if (!editing) return { issues: [] as ItineraryIssue[] };
    return validateItinerary(editing.itinerary, {
      durationDays: Number(editing.duration_days) || 1,
      requireForPublish: editing.is_active,
    });
  }, [editing]);
  const issuesByIndex = useMemo(() => {
    const map = new Map<number, string>();
    for (const it of itineraryValidation.issues) map.set(it.index, it.message);
    return map;
  }, [itineraryValidation.issues]);

  // ---- CSV export / import
  const handleExportCSV = () => {
    const rows = filteredTours.length ? filteredTours : tours;
    if (!rows.length) {
      toast.error("Nothing to export.");
      return;
    }
    const csv = toursToCSV(rows.map((r) => ({
      id: r.id, title: r.title, description: r.description ?? "",
      destination_country: r.destination_country, departure_city: r.departure_city,
      duration_days: r.duration_days, price_pkr: Number(r.price_pkr),
      total_seats: r.total_seats, image_url: r.image_url,
      is_active: r.is_active, vendor_id: r.vendor_id, itinerary: r.itinerary,
    })));
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(`globetrek-tours-${stamp}.csv`, csv);
    toast.success(`Exported ${rows.length} tour${rows.length === 1 ? "" : "s"}`);
  };

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseToursCSV(text);
    setImportPreview({ rows: parsed.valid, errors: parsed.errors });
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const commitImport = async () => {
    if (!importPreview) return;
    const defaultVendor = vendors[0]?.id ?? "";
    setImporting(true);
    let inserted = 0, updated = 0, skipped = 0;
    try {
      for (const r of importPreview.rows) {
        const vendor_id = r.vendor_id || defaultVendor;
        if (!vendor_id) { skipped++; continue; }
        const payload = {
          vendor_id,
          title: r.title,
          description: r.description,
          destination_country: r.destination_country,
          departure_city: r.departure_city,
          duration_days: r.duration_days,
          price_pkr: r.price_pkr,
          total_seats: r.total_seats,
          image_url: r.image_url || null,
          is_active: r.is_active,
          itinerary: r.itinerary,
        };
        if (r.id) {
          const { error } = await supabase.from("tours").update(payload).eq("id", r.id);
          if (error) { skipped++; continue; }
          updated++;
        } else {
          const { error } = await supabase.from("tours").insert(payload);
          if (error) { skipped++; continue; }
          inserted++;
        }
      }
      toast.success(`Import complete — ${inserted} new, ${updated} updated${skipped ? `, ${skipped} skipped` : ""}`);
      setImportPreview(null);
      invalidate();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };


  const openCreate = () => {
    const defaultVendor = vendors[0]?.id ?? "";
    setEditing({ ...emptyForm, vendor_id: defaultVendor });
  };

  const openEdit = (t: TourRow) => {
    setEditing({
      id: t.id,
      vendor_id: t.vendor_id,
      title: t.title,
      description: t.description ?? "",
      destination_country: t.destination_country,
      departure_city: t.departure_city,
      duration_days: t.duration_days,
      price_pkr: Number(t.price_pkr),
      total_seats: t.total_seats,
      image_url: t.image_url ?? "",
      is_active: t.is_active,
      itinerary: normalizeItinerary(t.itinerary),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Global tours</h2>
          <p className="text-xs text-muted-foreground">
            Create, edit and publish tours that power the featured tiles on the landing page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleCsvFile(f);
            }}
          />
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => csvInputRef.current?.click()}>
            <FileSpreadsheet className="size-4" /> Import CSV
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download className="size-4" /> Export CSV
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" /> New tour
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, destination, city, vendor…"
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-nowrap">
            <Select value={destinationFilter} onValueChange={setDestinationFilter}>
              <SelectTrigger className="lg:w-[160px]"><SelectValue placeholder="Destination" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All destinations</SelectItem>
                {destinationOptions.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="lg:w-[180px]"><SelectValue placeholder="Vendor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="lg:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="size-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
        {!isLoading && (
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            Showing {filteredTours.length} of {tours.length} tour{tours.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="space-y-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-semibold">{selectedCount}</span> selected
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm" variant="secondary" className="gap-2"
                disabled={bulkPublishMutation.isPending || bulkDeleteMutation.isPending}
                onClick={() => bulkPublishMutation.mutate({ ids: [...selected], is_active: true })}
              >
                <Eye className="size-4" /> Publish
              </Button>
              <Button
                size="sm" variant="secondary" className="gap-2"
                disabled={bulkPublishMutation.isPending || bulkDeleteMutation.isPending}
                onClick={() => bulkPublishMutation.mutate({ ids: [...selected], is_active: false })}
              >
                <EyeOff className="size-4" /> Unpublish
              </Button>
              <Button
                size="sm" variant="destructive" className="gap-2"
                disabled={bulkPublishMutation.isPending || bulkDeleteMutation.isPending}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
              <Button
                size="sm" variant="ghost"
                disabled={bulkPublishMutation.isPending || bulkDeleteMutation.isPending}
                onClick={clearSelection}
              >
                Cancel
              </Button>
            </div>
          </div>

          {bulkProgress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 className={`size-3 ${bulkProgress.done < bulkProgress.total ? "animate-spin" : ""}`} />
                  {bulkProgress.action === "delete"
                    ? "Deleting"
                    : bulkProgress.action === "publish"
                      ? "Publishing"
                      : "Unpublishing"}{" "}
                  {bulkProgress.done} / {bulkProgress.total}
                  {bulkProgress.failed > 0 && (
                    <span className="text-destructive">· {bulkProgress.failed} failed</span>
                  )}
                </span>
                <span className="tabular-nums">
                  {Math.round((bulkProgress.done / Math.max(1, bulkProgress.total)) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
                <div
                  className="h-full bg-primary transition-all duration-200 ease-out"
                  style={{ width: `${(bulkProgress.done / Math.max(1, bulkProgress.total)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[auto_1.4fr_1fr_auto_auto_auto_auto] gap-4 border-b border-border bg-surface/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center">
            <Checkbox
              checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
              onCheckedChange={(v) => toggleAllVisible(!!v)}
              aria-label="Select all visible"
            />
          </div>
          <div>Tour</div>
          <div>Vendor</div>
          <div>Country</div>
          <div>Status</div>
          <div className="text-right">Price</div>
          <div className="text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
          </div>
        ) : tours.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No tours yet. Click <strong>New tour</strong> to seed one.
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No tours match your filters.{" "}
            <button onClick={clearFilters} className="text-primary underline-offset-2 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          filteredTours.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[auto_1.4fr_1fr_auto_auto_auto_auto] items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-0"
            >
              <div className="flex items-center">
                <Checkbox
                  checked={selected.has(t.id)}
                  onCheckedChange={(v) => toggleOne(t.id, !!v)}
                  aria-label={`Select ${t.title}`}
                />
              </div>
              <div className="min-w-0 truncate font-medium">{t.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {t.profiles?.company_name || t.profiles?.full_name || "—"}
              </div>
              <div className="text-xs text-muted-foreground">{t.destination_country}</div>
              <div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${
                    t.is_active
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {t.is_active ? "Published" : "Draft"}
                </span>
              </div>
              <div className="text-right font-semibold tabular-nums text-highlight">
                {formatPKR(Number(t.price_pkr))}
              </div>
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost" size="icon"
                  title={t.is_active ? "Unpublish" : "Publish"}
                  onClick={() => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}
                >
                  {t.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(t)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Delete" onClick={() => setDeleteId(t.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit tour" : "Create tour"}</DialogTitle>
            <DialogDescription>
              Published tours appear immediately in the landing-page featured grid. The preview on the right updates as you type.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="e.g. 7-Day Turkey Explorer"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    placeholder="Short summary shown on the tour detail page."
                  />
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Select
                    value={editing.vendor_id}
                    onValueChange={(v) => setEditing({ ...editing, vendor_id: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Destination country / countries</Label>
                  <Input
                    value={editing.destination_country}
                    onChange={(e) => setEditing({ ...editing, destination_country: e.target.value })}
                    placeholder="e.g. Malaysia-Vietnam-Thailand (use hyphens for multiple countries)"
                    list="admin-global-countries"
                  />
                  <datalist id="admin-global-countries">
                    {DESTINATIONS.map((d) => <option key={d} value={d} />)}
                  </datalist>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    For multi-country tours, separate countries with a hyphen (e.g. <strong>Malaysia-Vietnam-Thailand</strong> or enter <strong>Europe</strong>). Separate visa entries will be generated automatically.
                  </p>
                </div>
                <div>
                  <Label>Departure city</Label>
                  <Select
                    value={editing.departure_city}
                    onValueChange={(v) => setEditing({ ...editing, departure_city: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTURE_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (days)</Label>
                  <Input
                    type="number" min={1}
                    value={editing.duration_days}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      let autoReturn = editing.accommodation?.return_date || "";
                      if (editing.accommodation?.departure_date && days > 0) {
                        const d = new Date(editing.accommodation.departure_date);
                        if (!isNaN(d.getTime())) {
                          d.setDate(d.getDate() + (days - 1));
                          autoReturn = d.toISOString().split("T")[0];
                        }
                      }
                      setEditing({
                        ...editing,
                        duration_days: days,
                        accommodation: {
                          ...editing.accommodation,
                          return_date: autoReturn,
                        },
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>Price (PKR)</Label>
                  <Input
                    type="number" min={0}
                    value={editing.price_pkr}
                    onChange={(e) => setEditing({ ...editing, price_pkr: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Total seats</Label>
                  <Input
                    type="number" min={1}
                    value={editing.total_seats}
                    onChange={(e) => setEditing({ ...editing, total_seats: Number(e.target.value) })}
                  />
                </div>

                <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3 border-t border-border/50 pt-3">
                  <div>
                    <Label>Departure Date</Label>
                    <Input
                      type="date"
                      value={editing.accommodation?.departure_date || ""}
                      onChange={(e) => {
                        const dep = e.target.value;
                        let autoReturn = editing.accommodation?.return_date || "";
                        let autoDeadline = editing.accommodation?.booking_deadline || "";
                        if (dep && editing.duration_days > 0) {
                          const d = new Date(dep);
                          if (!isNaN(d.getTime())) {
                            d.setDate(d.getDate() + (editing.duration_days - 1));
                            autoReturn = d.toISOString().split("T")[0];
                          }
                        }
                        if (!autoDeadline) autoDeadline = dep;
                        setEditing({
                          ...editing,
                          accommodation: {
                            ...editing.accommodation,
                            departure_date: dep,
                            return_date: autoReturn,
                            booking_deadline: autoDeadline,
                          },
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Return Date</Label>
                    <Input
                      type="date"
                      value={editing.accommodation?.return_date || ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          accommodation: {
                            ...editing.accommodation,
                            return_date: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Booking Deadline</Label>
                    <Input
                      type="date"
                      value={editing.accommodation?.booking_deadline || ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          accommodation: {
                            ...editing.accommodation,
                            booking_deadline: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Image upload */}
                <div className="sm:col-span-2">
                  <Label>Cover image</Label>
                  <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-3 sm:flex-row sm:items-center">
                    <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                      {editing.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editing.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleImageUpload(f);
                          }}
                        />
                        <Button
                          type="button" variant="secondary" size="sm" className="gap-2"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                          {editing.image_url ? "Replace image" : "Upload image"}
                        </Button>
                        {editing.image_url && (
                          <Button
                            type="button" variant="ghost" size="sm"
                            onClick={() => setEditing({ ...editing, image_url: "" })}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <Input
                        value={editing.image_url}
                        onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                        placeholder="…or paste an https:// image URL"
                        className="text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        JPG/PNG/WebP, up to 8MB. Uploads are stored privately with a long-lived signed URL.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:col-span-2">
                  <Switch
                    checked={editing.is_active}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                  />
                  <Label className="!m-0">
                    {editing.is_active ? "Published — visible on landing page" : "Draft — hidden"}
                  </Label>
                </div>

                {/* Itinerary editor */}
                <div className="sm:col-span-2 space-y-2 rounded-xl border border-border bg-surface/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">Day-by-day itinerary</p>
                      <p className="text-[11px] text-muted-foreground">
                        Shown on the tour detail page. Drag the grip handle to reorder, or use the arrows.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={autofillDays}>
                        Auto-fill {editing.duration_days} days
                      </Button>
                      <Button type="button" size="sm" variant="secondary" className="gap-1" onClick={addDay}>
                        <Plus className="size-3.5" /> Add day
                      </Button>
                    </div>
                  </div>

                  {itineraryValidation.error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                      <span>{itineraryValidation.error}</span>
                    </div>
                  )}

                  {editing.itinerary.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      No days yet. Click <strong>Add day</strong> or <strong>Auto-fill</strong>.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {editing.itinerary.map((d, i) => {
                        const issue = issuesByIndex.get(i);
                        const isDragged = dragIndex === i;
                        const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
                        return (
                          <div
                            key={i}
                            onDragOver={(e) => {
                              if (dragIndex === null) return;
                              e.preventDefault();
                              if (overIndex !== i) setOverIndex(i);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragIndex !== null) reorderTo(dragIndex, i);
                              setDragIndex(null);
                              setOverIndex(null);
                            }}
                            onDragLeave={() => { if (overIndex === i) setOverIndex(null); }}
                            className={`rounded-lg border bg-background/60 p-3 transition-all ${
                              issue ? "border-destructive/50" : "border-border"
                            } ${isDragged ? "opacity-40" : ""} ${
                              isOver ? "ring-2 ring-primary/60 border-primary/60" : ""
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                draggable
                                onDragStart={(e) => {
                                  setDragIndex(i);
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                                className="flex cursor-grab flex-col items-center pt-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                                title="Drag to reorder"
                                aria-label={`Drag day ${i + 1}`}
                              >
                                <GripVertical className="size-4" />
                                <span className="mt-1 text-[10px] font-semibold tabular-nums">D{i + 1}</span>
                              </button>
                              <div className="grid flex-1 gap-2">
                                <Input
                                  value={d.title}
                                  onChange={(e) => updateDay(i, { title: e.target.value })}
                                  placeholder={`Day ${i + 1} title (e.g. Istanbul arrival & Bosphorus cruise)`}
                                  aria-invalid={!!issue}
                                />
                                <Textarea
                                  rows={2}
                                  value={d.detail}
                                  onChange={(e) => updateDay(i, { detail: e.target.value })}
                                  placeholder="What's included today: transfers, meals, sights, activities…"
                                />
                                {issue && (
                                  <p className="text-[11px] text-destructive">{issue}</p>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  type="button" variant="ghost" size="icon"
                                  title="Move up" disabled={i === 0}
                                  onClick={() => moveDay(i, -1)}
                                >
                                  <ArrowUp className="size-4" />
                                </Button>
                                <Button
                                  type="button" variant="ghost" size="icon"
                                  title="Move down" disabled={i === editing.itinerary.length - 1}
                                  onClick={() => moveDay(i, 1)}
                                >
                                  <ArrowDown className="size-4" />
                                </Button>
                                <Button
                                  type="button" variant="ghost" size="icon"
                                  title="Remove day"
                                  onClick={() => removeDay(i)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Featured-tile preview
                  </p>
                  <span className="text-[10px] text-muted-foreground">Live</span>
                </div>
                <TourPreviewCard
                  input={{
                    title: editing.title,
                    destination_country: editing.destination_country,
                    departure_city: editing.departure_city,
                    duration_days: editing.duration_days,
                    price_pkr: editing.price_pkr,
                    total_seats: editing.total_seats,
                    image_url: editing.image_url,
                    is_active: editing.is_active,
                    vendor_label: vendors.find((v) => v.id === editing.vendor_id)?.label,
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  This is exactly how the tile renders in the landing-page featured grid.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => editing && saveMutation.mutate(editing)}
              disabled={saveMutation.isPending || !!itineraryValidation.error}
              className="gap-2"
            >
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {editing?.id ? "Save changes" : "Create tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tour?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the tour and any associated leads/bookings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} tour{selectedCount === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected tours and any associated leads/bookings.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate([...selected])}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete {selectedCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!importPreview} onOpenChange={(o) => !o && setImportPreview(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import tours from CSV</DialogTitle>
            <DialogDescription>
              Rows with an <code>id</code> update existing tours; rows without one are inserted.
              Missing <code>vendor_id</code> falls back to the first vendor.
            </DialogDescription>
          </DialogHeader>
          {importPreview && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
                  {importPreview.rows.length} valid row{importPreview.rows.length === 1 ? "" : "s"}
                </span>
                {importPreview.errors.length > 0 && (
                  <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs text-destructive">
                    {importPreview.errors.length} issue{importPreview.errors.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {importPreview.errors.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-[12px] text-destructive">
                  {importPreview.errors.slice(0, 30).map((e, i) => (<li key={i}>• {e}</li>))}
                </ul>
              )}
              {importPreview.rows.length > 0 && (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-[12px]">
                    <thead className="bg-surface/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1.5 text-left">Title</th>
                        <th className="px-2 py-1.5 text-left">Destination</th>
                        <th className="px-2 py-1.5 text-right">PKR</th>
                        <th className="px-2 py-1.5 text-left">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.rows.map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-2 py-1.5 truncate">{r.title}</td>
                          <td className="px-2 py-1.5 text-muted-foreground">{r.destination_country}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{formatPKR(r.price_pkr)}</td>
                          <td className="px-2 py-1.5 text-muted-foreground">{r.id ? "Update" : "Insert"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportPreview(null)}>Cancel</Button>
            <Button
              onClick={commitImport}
              disabled={importing || !importPreview || importPreview.rows.length === 0}
              className="gap-2"
            >
              {importing && <Loader2 className="size-4 animate-spin" />}
              Import {importPreview?.rows.length ?? 0} row{(importPreview?.rows.length ?? 0) === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

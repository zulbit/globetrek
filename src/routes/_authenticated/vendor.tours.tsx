import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Search, X,
  Upload, GripVertical, ArrowUp, ArrowDown, ImageIcon,
  AlertCircle, ExternalLink, MapPin, Plane, Calendar, Users, Tag,
  Clock, FileText, BedDouble, Sparkles, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  formatPKR, fallbackImageFor,
  type ItineraryDay, type ItineraryActivity,
  type TourRequirement, type TourAccommodation,
} from "@/lib/tours";
import {
  optimizeImage, validateItinerary, normalizeItinerary,
  type ItineraryIssue,
} from "@/lib/tour-admin-utils";
import { saveTourServer, setTourPublishedServer } from "@/lib/tours.functions";
import { generateTourAIServer } from "@/lib/tour-ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { UpgradeModal } from "@/components/upgrade-modal";

export const Route = createFileRoute("/_authenticated/vendor/tours")({
  component: VendorTours,
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
  requirements: TourRequirement[] | null;
  accommodation: TourAccommodation | null;
  extra_notes: string | null;
  created_at?: string;
};

const DESTINATIONS = [
  "Turkey", "Thailand", "UAE", "Singapore", "Vietnam",
  "Malaysia", "UK", "Europe", "Saudi Arabia", "Maldives", "Azerbaijan",
];
const DEPARTURE_CITIES = ["Karachi", "Lahore", "Islamabad"];
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5;

const DEFAULT_REQUIREMENTS: TourRequirement[] = [
  { item: "Original Passport (6+ months validity)", required: true },
  { item: "Visa", required: true, note: "Provided/assisted by vendor" },
  { item: "Bank Statement (last 6 months)", required: true },
  { item: "Family Registration Certificate (FRC / NADRA)", required: true },
  { item: "2 recent passport-size photos", required: true },
  { item: "Copy of CNIC", required: true },
  { item: "Tour Guide (English/Urdu speaking)", required: false, note: "Included in package" },
  { item: "Travel insurance", required: false },
];

const DEFAULT_ACCOMMODATION: TourAccommodation = {
  standard: "Twin sharing — 2 guests per room in 4★ hotels",
  premium: { description: "Single occupancy — 1 guest per room in 4★/5★ hotels", additional_pkr: 45000 },
};

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
  requirements: TourRequirement[];
  accommodation: TourAccommodation;
  extra_notes: string;
};

const emptyForm = (vendor_id: string): FormState => ({
  id: "",
  vendor_id,
  title: "",
  description: "",
  destination_country: "Turkey",
  departure_city: "Karachi",
  duration_days: 7,
  price_pkr: 250000,
  total_seats: 20,
  image_url: "",
  is_active: false,
  itinerary: [],
  requirements: DEFAULT_REQUIREMENTS,
  accommodation: DEFAULT_ACCOMMODATION,
  extra_notes: "",
});


function VendorTours() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string>("");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [viewing, setViewing] = useState<TourRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const saveTourFn = useServerFn(saveTourServer);
  const setPublishedFn = useServerFn(setTourPublishedServer);
  const generateAIFn = useServerFn(generateTourAIServer);
  const [aiBusy, setAiBusy] = useState<null | "description" | "plan">(null);
  const [upgradeOpen, setUpgradeOpen] = useState<null | string>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const { data: vendorTier = "free" } = useQuery({
    queryKey: ["vendor-tier", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", userId)
        .maybeSingle();
      return (data?.subscription_tier as string | undefined) ?? "free";
    },
  });
  const isPro = vendorTier === "pro";

  // null = unlimited, 0 = not included in tier (kept in sync with server)
  const AI_TIER_INCLUDES: Record<string, { description: boolean; plan: boolean }> = {
    free: { description: false, plan: false },
    starter: { description: true, plan: false },
    pro: { description: true, plan: true },
    agency: { description: true, plan: true },
  };
  const aiAvailable = AI_TIER_INCLUDES[vendorTier] ?? AI_TIER_INCLUDES.free;


  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["vendor-tours", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, vendor_id, title, description, destination_country, departure_city, duration_days, price_pkr, total_seats, image_url, is_active, itinerary, requirements, accommodation, extra_notes, created_at")
        .eq("vendor_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TourRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["vendor-tours"] });
    qc.invalidateQueries({ queryKey: ["featured-tours"] });
    qc.invalidateQueries({ queryKey: ["tours"] });
  };

  const filteredTours = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tours.filter((t) => {
      if (statusFilter === "published" && !t.is_active) return false;
      if (statusFilter === "draft" && t.is_active) return false;
      if (q) {
        const hay = [t.title, t.destination_country, t.departure_city].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tours, search, statusFilter]);

  const stats = useMemo(() => {
    const published = tours.filter((t) => t.is_active).length;
    const totalSeats = tours.reduce((sum, t) => sum + (t.total_seats ?? 0), 0);
    return { total: tours.length, published, drafts: tours.length - published, totalSeats };
  }, [tours]);

  const saveMutation = useMutation({
    mutationFn: async (form: FormState) => {
      const v = validateItinerary(form.itinerary, {
        durationDays: Number(form.duration_days) || 1,
        requireForPublish: form.is_active,
      });
      if (v.error) throw new Error(v.error);
      return saveTourFn({
        data: {
          id: form.id || undefined,
          vendor_id: userId,
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
          requirements: form.requirements,
          accommodation: form.accommodation,
          extra_notes: form.extra_notes,
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
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) =>
      setPublishedFn({ data: { id, is_active } }),
    onMutate: async ({ id, is_active }) => {
      await qc.cancelQueries({ queryKey: ["vendor-tours", userId] });
      const prev = qc.getQueryData<TourRow[]>(["vendor-tours", userId]);
      qc.setQueryData<TourRow[]>(["vendor-tours", userId], (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, is_active } : t)),
      );
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["vendor-tours", userId], ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tours").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tour deleted");
      setDeleteId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleImageUpload = async (raw: File) => {
    if (!editing) return;
    if (!raw.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (raw.size > 20 * 1024 * 1024) {
      toast.error("Max image size is 20MB.");
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
      toast.success(savedKb > 20 ? `Uploaded (saved ${savedKb} KB)` : "Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addDay = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      itinerary: [...editing.itinerary, { day: editing.itinerary.length + 1, title: "", detail: "", activities: [] }],
    });
  };
  const addActivity = (dayIdx: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      itinerary: editing.itinerary.map((d, i) =>
        i === dayIdx ? { ...d, activities: [...(d.activities ?? []), { time: "", title: "" }] } : d,
      ),
    });
  };
  const updateActivity = (dayIdx: number, aIdx: number, patch: Partial<ItineraryActivity>) => {
    if (!editing) return;
    setEditing({
      ...editing,
      itinerary: editing.itinerary.map((d, i) => {
        if (i !== dayIdx) return d;
        const acts = (d.activities ?? []).map((a, j) => (j === aIdx ? { ...a, ...patch } : a));
        return { ...d, activities: acts };
      }),
    });
  };
  const removeActivity = (dayIdx: number, aIdx: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      itinerary: editing.itinerary.map((d, i) => {
        if (i !== dayIdx) return d;
        return { ...d, activities: (d.activities ?? []).filter((_, j) => j !== aIdx) };
      }),
    });
  };

  const updateDay = (idx: number, patch: Partial<ItineraryDay>) => {
    if (!editing) return;
    setEditing({
      ...editing,
      itinerary: editing.itinerary.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    });
  };
  const removeDay = (idx: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      itinerary: editing.itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })),
    });
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
  const reorderTo = (from: number, to: number) => {
    if (!editing || from === to) return;
    const next = [...editing.itinerary];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setEditing({ ...editing, itinerary: next.map((d, i) => ({ ...d, day: i + 1 })) });
  };

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

  const openCreate = () => setEditing(emptyForm(userId));
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
      requirements: (t.requirements && t.requirements.length ? t.requirements : DEFAULT_REQUIREMENTS),
      accommodation: t.accommodation ?? DEFAULT_ACCOMMODATION,
      extra_notes: t.extra_notes ?? "",
    });
  };

  const runAI = async (mode: "description" | "plan") => {
    if (!editing) return;
    if (!aiAvailable[mode]) {
      setUpgradeOpen(mode === "plan" ? "AI full-trip planner" : "AI description writer");
      return;
    }
    if (!editing.title.trim()) {
      toast.error("Add a tour title first so AI has some context.");
      return;
    }
    setAiBusy(mode);
    try {

      const res = await generateAIFn({
        data: {
          mode,
          title: editing.title,
          destination_country: editing.destination_country,
          departure_city: editing.departure_city,
          duration_days: Number(editing.duration_days) || 1,
          price_pkr: Number(editing.price_pkr) || 0,
          description: editing.description,
        },
      });
      if (mode === "description") {
        setEditing((prev) => (prev ? { ...prev, description: res.description ?? prev.description } : prev));
        toast.success("AI drafted a short description ✨");
      } else {
        setEditing((prev) => prev ? {
          ...prev,
          description: res.description?.trim() ? res.description : prev.description,
          itinerary: (res.itinerary && res.itinerary.length ? res.itinerary : prev.itinerary),
        } : prev);
        toast.success("AI planned the full trip ✨");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  };




  return (
    <div className="space-y-4">
      <UpgradeModal
        open={upgradeOpen !== null}
        onOpenChange={(v) => !v && setUpgradeOpen(null)}
        feature={upgradeOpen ?? undefined}
        recommend="pro"
      />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">My tours</h2>
          <p className="text-xs text-muted-foreground">
            List international packages, upload photos, plan itineraries, and publish when ready.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" /> New tour
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total tours", value: stats.total, icon: Tag },
          { label: "Published", value: stats.published, icon: Eye },
          { label: "Drafts", value: stats.drafts, icon: EyeOff },
          { label: "Seats offered", value: stats.totalSeats, icon: Users },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <s.icon className="size-3.5" /> {s.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, destination, departure city…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          {(search || statusFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); }} className="gap-1">
              <X className="size-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tour cards */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" /> Loading your tours…
        </div>
      ) : tours.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Plus className="size-5" />
          </div>
          <h3 className="text-base font-semibold">List your first international tour</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Add photos, day-by-day plans, seats, PKR pricing and departure city. You can save as a draft
            and publish once it's polished.
          </p>
          <Button onClick={openCreate} className="mt-4 gap-2">
            <Plus className="size-4" /> Create tour
          </Button>
        </div>
      ) : filteredTours.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No tours match your filters.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTours.map((t) => (
            <article key={t.id} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40">
              <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                {(() => {
                  const src = t.image_url || fallbackImageFor(t.destination_country, t.title);
                  return src ? (
                    <img src={src} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-8" />
                    </div>
                  );
                })()}
                <span className={`absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur ${
                  t.is_active
                    ? "border-primary/50 bg-primary/25 text-primary-foreground"
                    : "border-border bg-background/70 text-muted-foreground"
                }`}>
                  {t.is_active ? "Published" : "Draft"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 font-semibold">{t.title || "Untitled tour"}</h3>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{t.destination_country}</span>
                  <span className="inline-flex items-center gap-1"><Plane className="size-3" />{t.departure_city}</span>
                  <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{t.duration_days}d</span>
                  <span className="inline-flex items-center gap-1"><Users className="size-3" />{t.total_seats} seats</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-lg font-semibold tabular-nums text-highlight">{formatPKR(Number(t.price_pkr))}</span>
                  <span className="text-[11px] text-muted-foreground">per person</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <Button size="sm" variant="secondary" className="gap-1" onClick={() => setViewing(t)}>
                    <ExternalLink className="size-3.5" /> View
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-1" onClick={() => openEdit(t)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1"
                    onClick={() => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}>
                    {t.is_active ? <><EyeOff className="size-3.5" /> Unpublish</> : <><Eye className="size-3.5" /> Publish</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(t.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Editor dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit tour" : "Create a new tour"}</DialogTitle>
            <DialogDescription>
              Fill in the essentials, upload a hero image, and plan the day-by-day itinerary. The preview on the right updates live.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-5">
                {/* Basics */}
                <section className="space-y-3 rounded-xl border border-border bg-surface/40 p-4">
                  <SectionTitle>Basics</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Title</Label>
                      <Input value={editing.title}
                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                        placeholder="e.g. 7-Day Turkey Explorer — Istanbul & Cappadocia" />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <Label>Short description</Label>
                        <Button
                          type="button" size="sm" variant="ghost"
                          className="h-7 gap-1 px-2 text-[11px] text-primary hover:text-primary"
                          onClick={() => void runAI("description")}
                          disabled={aiBusy !== null}
                          title={aiAvailable.description ? "Generate a short pitch with AI" : "Upgrade to unlock AI descriptions"}
                        >
                          {aiBusy === "description" ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : aiAvailable.description ? (
                            <Sparkles className="size-3.5" />
                          ) : (
                            <Lock className="size-3.5" />
                          )}
                          {aiBusy === "description" ? "Writing…" : "AI draft"}
                          {!aiAvailable.description && <span className="ml-1 rounded bg-amber-500/15 px-1 text-[9px] font-semibold uppercase tracking-wider text-amber-500">Pro</span>}

                        </Button>
                      </div>
                      <Textarea rows={3} value={editing.description}
                        onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                        placeholder="One-paragraph pitch: highlights, inclusions, what makes it special." />
                    </div>
                    <div>
                      <Label>Destination country</Label>
                      <Select value={editing.destination_country}
                        onValueChange={(v) => setEditing({ ...editing, destination_country: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DESTINATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Departure city</Label>
                      <Select value={editing.departure_city}
                        onValueChange={(v) => setEditing({ ...editing, departure_city: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEPARTURE_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Pricing & capacity */}
                <section className="space-y-3 rounded-xl border border-border bg-surface/40 p-4">
                  <SectionTitle>Pricing, duration & seats</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label>Duration (days)</Label>
                      <Input type="number" min={1} value={editing.duration_days}
                        onChange={(e) => setEditing({ ...editing, duration_days: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Price per person (PKR)</Label>
                      <Input type="number" min={0} step={1000} value={editing.price_pkr}
                        onChange={(e) => setEditing({ ...editing, price_pkr: Number(e.target.value) })} />
                      <p className="mt-1 text-[11px] text-muted-foreground">{formatPKR(Number(editing.price_pkr) || 0)}</p>
                    </div>
                    <div>
                      <Label>Total seats</Label>
                      <Input type="number" min={1} value={editing.total_seats}
                        onChange={(e) => setEditing({ ...editing, total_seats: Number(e.target.value) })} />
                    </div>
                  </div>
                </section>

                {/* Image */}
                <section className="space-y-3 rounded-xl border border-border bg-surface/40 p-4">
                  <SectionTitle>Cover image</SectionTitle>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface sm:w-40">
                      {editing.image_url ? (
                        <img src={editing.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="size-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleImageUpload(f);
                          }} />
                        <Button type="button" variant="secondary" size="sm" className="gap-2"
                          onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                          {editing.image_url ? "Replace image" : "Upload image"}
                        </Button>
                        {editing.image_url && (
                          <Button type="button" variant="ghost" size="sm"
                            onClick={() => setEditing({ ...editing, image_url: "" })}>
                            Remove
                          </Button>
                        )}
                      </div>
                      <Input value={editing.image_url}
                        onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                        placeholder="…or paste an https:// image URL" className="text-xs" />
                      <p className="text-[11px] text-muted-foreground">
                        JPG/PNG/WebP. Images are auto-optimized to under ~1600px.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Itinerary */}
                <section className="space-y-3 rounded-xl border border-border bg-surface/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <SectionTitle>Day-by-day itinerary</SectionTitle>
                      <p className="text-[11px] text-muted-foreground">
                        Drag the grip handle to reorder days. Auto-fill scaffolds one entry per duration day.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button" size="sm"
                        className="gap-1 bg-gradient-to-r from-primary to-emerald-400 text-primary-foreground hover:opacity-90"
                        onClick={() => void runAI("plan")}
                        disabled={aiBusy !== null}
                        title={aiAvailable.plan ? "Let AI plan the whole trip" : "Upgrade to unlock AI trip planning"}
                      >
                        {aiBusy === "plan" ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : aiAvailable.plan ? (
                          <Sparkles className="size-3.5" />
                        ) : (
                          <Lock className="size-3.5" />
                        )}
                        {aiBusy === "plan" ? "Planning trip…" : "AI plan full trip"}
                        {!aiAvailable.plan && <span className="ml-1 rounded bg-amber-500/20 px-1 text-[9px] font-semibold uppercase tracking-wider text-amber-100">Pro</span>}

                      </Button>
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
                      No days yet. Click <strong>Add day</strong> or <strong>Auto-fill</strong> to scaffold.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {editing.itinerary.map((d, i) => {
                        const issue = issuesByIndex.get(i);
                        const isDragged = dragIndex === i;
                        const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
                        return (
                          <div key={i}
                            onDragOver={(e) => {
                              if (dragIndex === null) return;
                              e.preventDefault();
                              if (overIndex !== i) setOverIndex(i);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragIndex !== null) reorderTo(dragIndex, i);
                              setDragIndex(null); setOverIndex(null);
                            }}
                            onDragLeave={() => { if (overIndex === i) setOverIndex(null); }}
                            className={`rounded-lg border bg-background/60 p-3 transition-all ${
                              issue ? "border-destructive/50" : "border-border"
                            } ${isDragged ? "opacity-40" : ""} ${
                              isOver ? "ring-2 ring-primary/60 border-primary/60" : ""
                            }`}>
                            <div className="flex items-start gap-2">
                              <button type="button" draggable
                                onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; }}
                                onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                                className="flex cursor-grab flex-col items-center pt-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                                title="Drag to reorder" aria-label={`Drag day ${i + 1}`}>
                                <GripVertical className="size-4" />
                                <span className="mt-1 text-[10px] font-semibold tabular-nums">D{i + 1}</span>
                              </button>
                              <div className="grid flex-1 gap-2">
                                <Input value={d.title}
                                  onChange={(e) => updateDay(i, { title: e.target.value })}
                                  placeholder={`Day ${i + 1} title (e.g. Istanbul arrival & Bosphorus cruise)`}
                                  aria-invalid={!!issue} />
                                <Textarea rows={2} value={d.detail}
                                  onChange={(e) => updateDay(i, { detail: e.target.value })}
                                  placeholder="What's included today: transfers, meals, sights, activities…" />
                                {/* Activities */}
                                <div className="rounded-md border border-dashed border-border bg-background/40 p-2">
                                  <div className="mb-1.5 flex items-center justify-between">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                      <Clock className="mr-1 inline size-3" />Activities (time-slotted)
                                    </span>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-[11px]"
                                      onClick={() => addActivity(i)}>
                                      <Plus className="size-3" /> Add
                                    </Button>
                                  </div>
                                  {(d.activities ?? []).length === 0 ? (
                                    <p className="px-1 text-[11px] text-muted-foreground">
                                      Add slots like "09:00 — Airport pickup" or "14:00 — Lunch at old bazaar".
                                    </p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {(d.activities ?? []).map((a, aIdx) => (
                                        <div key={aIdx} className="flex items-center gap-1.5">
                                          <Input value={a.time}
                                            onChange={(e) => updateActivity(i, aIdx, { time: e.target.value })}
                                            placeholder="09:00" className="h-8 w-20 text-xs" />
                                          <Input value={a.title}
                                            onChange={(e) => updateActivity(i, aIdx, { title: e.target.value })}
                                            placeholder="Airport pickup & hotel check-in" className="h-8 flex-1 text-xs" />
                                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                                            onClick={() => removeActivity(i, aIdx)}>
                                            <X className="size-3.5 text-muted-foreground" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {issue && <p className="text-[11px] text-destructive">{issue}</p>}
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button type="button" variant="ghost" size="icon"
                                  title="Move up" disabled={i === 0} onClick={() => moveDay(i, -1)}>
                                  <ArrowUp className="size-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon"
                                  title="Move down" disabled={i === editing.itinerary.length - 1}
                                  onClick={() => moveDay(i, 1)}>
                                  <ArrowDown className="size-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" title="Remove day"
                                  onClick={() => removeDay(i)}>
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Requirements */}
                <section className="space-y-3 rounded-xl border border-border bg-surface/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <SectionTitle>Traveler requirements</SectionTitle>
                      <p className="text-[11px] text-muted-foreground">Documents & items travelers need to bring or arrange.</p>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm"
                        onClick={() => setEditing({ ...editing, requirements: DEFAULT_REQUIREMENTS })}>
                        Reset to defaults
                      </Button>
                      <Button type="button" variant="secondary" size="sm" className="gap-1"
                        onClick={() => setEditing({ ...editing, requirements: [...editing.requirements, { item: "", required: true }] })}>
                        <Plus className="size-3.5" /> Add
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-surface/70 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Requirement</th>
                          <th className="px-3 py-2 text-left font-medium">Note</th>
                          <th className="px-3 py-2 text-center font-medium">Required</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editing.requirements.length === 0 ? (
                          <tr><td colSpan={4} className="px-3 py-4 text-center text-xs text-muted-foreground">No requirements added.</td></tr>
                        ) : editing.requirements.map((r, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-2 py-1.5">
                              <Input value={r.item} className="h-8 text-xs"
                                onChange={(e) => setEditing({
                                  ...editing,
                                  requirements: editing.requirements.map((x, j) => j === i ? { ...x, item: e.target.value } : x),
                                })}
                                placeholder="e.g. Original Passport" />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input value={r.note ?? ""} className="h-8 text-xs"
                                onChange={(e) => setEditing({
                                  ...editing,
                                  requirements: editing.requirements.map((x, j) => j === i ? { ...x, note: e.target.value } : x),
                                })}
                                placeholder="Optional note" />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <Switch checked={r.required}
                                onCheckedChange={(v) => setEditing({
                                  ...editing,
                                  requirements: editing.requirements.map((x, j) => j === i ? { ...x, required: v } : x),
                                })} />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => setEditing({ ...editing, requirements: editing.requirements.filter((_, j) => j !== i) })}>
                                <Trash2 className="size-3.5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Accommodation */}
                <section className="space-y-3 rounded-xl border border-border bg-surface/40 p-4">
                  <SectionTitle><BedDouble className="mr-1 inline size-3.5" />Accommodation plan</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Standard (included)</Label>
                      <Textarea rows={3} value={editing.accommodation.standard ?? ""}
                        onChange={(e) => setEditing({
                          ...editing,
                          accommodation: { ...editing.accommodation, standard: e.target.value },
                        })}
                        placeholder="e.g. Twin sharing — 2 guests per room in 4★ hotels" />
                    </div>
                    <div className="space-y-2">
                      <Label>Premium upgrade (optional)</Label>
                      <Textarea rows={2} value={editing.accommodation.premium?.description ?? ""}
                        onChange={(e) => setEditing({
                          ...editing,
                          accommodation: {
                            ...editing.accommodation,
                            premium: {
                              description: e.target.value,
                              additional_pkr: editing.accommodation.premium?.additional_pkr ?? 0,
                            },
                          },
                        })}
                        placeholder="e.g. Single occupancy in 5★ hotels" />
                      <div>
                        <Label className="text-[11px]">Additional charge per person (PKR)</Label>
                        <Input type="number" min={0} step={1000}
                          value={editing.accommodation.premium?.additional_pkr ?? 0}
                          onChange={(e) => setEditing({
                            ...editing,
                            accommodation: {
                              ...editing.accommodation,
                              premium: {
                                description: editing.accommodation.premium?.description ?? "",
                                additional_pkr: Number(e.target.value),
                              },
                            },
                          })} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Extra notes */}
                <section className="space-y-2 rounded-xl border border-border bg-surface/40 p-4">
                  <SectionTitle><FileText className="mr-1 inline size-3.5" />Additional notes</SectionTitle>
                  <Textarea rows={3} value={editing.extra_notes}
                    onChange={(e) => setEditing({ ...editing, extra_notes: e.target.value })}
                    placeholder="Anything else travelers should know: weather, dress code, currency tips, SIM cards, group size, cancellation policy…" />
                </section>



                {/* Publish toggle */}
                <section className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-4">
                  <Switch checked={editing.is_active}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <div>
                    <p className="text-sm font-medium">
                      {editing.is_active ? "Published — visible on the marketplace" : "Draft — hidden from travelers"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Publish only when the itinerary is complete. You can toggle this any time.
                    </p>
                  </div>
                </section>
              </div>

              {/* Preview column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Live preview</p>
                  <span className="text-[10px] text-muted-foreground">Marketplace tile</span>
                </div>
                <TourPreviewCard input={{
                  title: editing.title,
                  destination_country: editing.destination_country,
                  departure_city: editing.departure_city,
                  duration_days: editing.duration_days,
                  price_pkr: editing.price_pkr,
                  total_seats: editing.total_seats,
                  image_url: editing.image_url,
                  is_active: editing.is_active,
                }} />
                <p className="text-[11px] text-muted-foreground">
                  This is exactly how travelers see your tile in the featured grid.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => editing && saveMutation.mutate(editing)}
              disabled={saveMutation.isPending || !!itineraryValidation.error || !editing?.title.trim()}
              className="gap-2">
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {editing?.id ? "Save changes" : (editing?.is_active ? "Create & publish" : "Save as draft")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>{viewing?.destination_country} · Departs {viewing?.departure_city}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              {viewing.image_url && (
                <div className="aspect-[16/9] overflow-hidden rounded-xl border border-border">
                  <img src={viewing.image_url} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Duration" value={`${viewing.duration_days} days`} />
                <Stat label="Price" value={formatPKR(Number(viewing.price_pkr))} highlight />
                <Stat label="Seats" value={String(viewing.total_seats)} />
                <Stat label="Status" value={viewing.is_active ? "Published" : "Draft"} />
              </div>
              {viewing.description && (
                <p className="text-sm text-muted-foreground">{viewing.description}</p>
              )}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Itinerary</p>
                <div className="space-y-2">
                  {normalizeItinerary(viewing.itinerary).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No itinerary added yet.</p>
                  ) : normalizeItinerary(viewing.itinerary).map((d, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface/50 p-3">
                      <p className="text-sm font-medium">Day {d.day}: {d.title || <span className="text-muted-foreground">Untitled</span>}</p>
                      {d.detail && <p className="mt-1 text-xs text-muted-foreground">{d.detail}</p>}
                      {(d.activities?.length ?? 0) > 0 && (
                        <ul className="mt-2 space-y-1 border-l-2 border-primary/30 pl-3">
                          {d.activities!.map((a, k) => (
                            <li key={k} className="flex gap-2 text-xs">
                              <span className="min-w-14 font-mono font-semibold text-primary">{a.time}</span>
                              <span className="text-muted-foreground">{a.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewing.requirements && viewing.requirements.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Requirements</p>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <tbody>
                        {viewing.requirements.map((r, i) => (
                          <tr key={i} className="border-t border-border first:border-0">
                            <td className="px-3 py-2">{r.item}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.note}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${
                                r.required ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-surface text-muted-foreground"
                              }`}>{r.required ? "Required" : "Optional"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {viewing.accommodation && (viewing.accommodation.standard || viewing.accommodation.premium) && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Accommodation</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {viewing.accommodation.standard && (
                      <div className="rounded-lg border border-border bg-surface/50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Standard · Included</p>
                        <p className="mt-1 text-xs text-muted-foreground">{viewing.accommodation.standard}</p>
                      </div>
                    )}
                    {viewing.accommodation.premium && (
                      <div className="rounded-lg border border-highlight/40 bg-highlight/5 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-highlight">Premium upgrade</p>
                        <p className="mt-1 text-xs text-muted-foreground">{viewing.accommodation.premium.description}</p>
                        <p className="mt-1 text-xs font-semibold text-highlight">+ {formatPKR(viewing.accommodation.premium.additional_pkr)} / person</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewing.extra_notes && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Additional notes</p>
                  <p className="whitespace-pre-line rounded-lg border border-border bg-surface/50 p-3 text-xs text-muted-foreground">{viewing.extra_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
            {viewing && (
              <>
                <Link to="/tours/$id" params={{ id: viewing.id }}>
                  <Button variant="secondary" className="gap-1"><ExternalLink className="size-3.5" /> Public page</Button>
                </Link>
                <Button onClick={() => { const v = viewing; setViewing(null); openEdit(v); }} className="gap-1">
                  <Pencil className="size-3.5" /> Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tour?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the tour and any associated leads. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{children}</p>;
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${highlight ? "text-highlight" : ""}`}>{value}</p>
    </div>
  );
}

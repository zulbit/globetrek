import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  CalendarDays,
  Clock,
  Users,
  Hotel,
  Plane,
  Shield,
  FileCheck,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BadgeCheck,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  PartyPopper,
  X,
  Plus,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DESTINATIONS } from "@/lib/tours";
import { useAuth } from "@/hooks/use-auth";
import {
  submitCustomTourLead,
  type CustomTourLeadInput,
} from "@/lib/custom-tour.functions";

export const Route = createFileRoute("/custom-tour")({
  component: CustomTourPage,
  head: () => ({
    meta: [
      {
        title:
          "Custom Group Tour & Itinerary Planner — GlobeTrek PK",
      },
      {
        name: "description",
        content:
          "Plan an exclusive group or custom tour for family & friends. Get AI-generated itineraries and competitive quotes from Pakistan's top verified travel vendors.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://globetrek.testbench.shop/custom-tour",
      },
    ],
  }),
});

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STEPS = [
  { label: "Logistics", icon: MapPin },
  { label: "Group", icon: Users },
  { label: "Services", icon: Hotel },
  { label: "Contact", icon: User },
] as const;

type GroupType = "family" | "friends" | "corporate" | "solo";
type HotelTier = "3star" | "4star" | "5star";
type FlightClass = "economy" | "business";

const PAKISTAN_CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Peshawar",
  "Multan",
  "Faisalabad",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Sukkur",
  "Abbottabad",
  "Mardan",
  "Mirpur (AJK)",
];

interface FormState {
  // Step 1
  departureCity: string;
  customCity: string;
  destinations: string[];
  customDestination: string;
  travelMonth: string;
  durationDays: number;
  // Step 2
  groupSize: number;
  groupType: GroupType;
  // Step 3
  hotelTier: HotelTier;
  visaNeeded: boolean;
  insuranceNeeded: boolean;
  flightClass: FlightClass;
  // Step 4
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  password: string;
  specialRequests: string;
}

const INITIAL: FormState = {
  departureCity: "",
  customCity: "",
  destinations: [],
  customDestination: "",
  travelMonth: "",
  durationDays: 7,
  groupSize: 4,
  groupType: "family",
  hotelTier: "4star",
  visaNeeded: true,
  insuranceNeeded: true,
  flightClass: "economy",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  password: "",
  specialRequests: "",
};

function CustomTourPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Pre-fill contact details if user is logged in
  React.useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        contactName: prev.contactName || profile?.full_name || user.user_metadata?.full_name || "",
        contactEmail: prev.contactEmail || user.email || "",
        contactPhone: prev.contactPhone || (user.user_metadata?.phone ? user.user_metadata.phone.replace(/^\+92/, "") : ""),
      }));
    }
  }, [user, profile]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const mutation = useMutation({
    mutationFn: (data: CustomTourLeadInput) => submitCustomTourLead({ data }),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const effectiveCity =
    form.departureCity === "__other__" ? form.customCity.trim() : form.departureCity;

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return !!(
          effectiveCity &&
          (form.destinations || []).length > 0 &&
          form.travelMonth &&
          form.durationDays >= 1
        );
      case 1:
        return form.groupSize >= 1;
      case 2:
        return true; // all have defaults
      case 3:
        return !!(
          form.contactName.trim() &&
          form.contactEmail.trim() &&
          form.contactPhone.trim() &&
          (user || form.password.trim().length >= 6)
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      // Submit
      mutation.mutate({
        departureCity: effectiveCity,
        destination: (form.destinations || []).join(", "),
        travelMonth: form.travelMonth,
        durationDays: form.durationDays,
        groupSize: form.groupSize,
        groupType: form.groupType,
        hotelTier: form.hotelTier,
        visaNeeded: form.visaNeeded,
        insuranceNeeded: form.insuranceNeeded,
        flightClass: form.flightClass,
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        password: user ? undefined : form.password.trim(),
        userId: user?.id,
        specialRequests: form.specialRequests.trim() || undefined,
      });
    }
  };

  if (submitted) {
    return (
      <SiteShell>
        <section className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-6 grid size-20 place-items-center rounded-full bg-emerald-500/15 ring-8 ring-emerald-500/10">
            <PartyPopper className="size-10 text-emerald-500" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400">
            <BadgeCheck className="size-4" />
            Traveler Profile Registered &amp; Request Live
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Your custom tour is underway!
          </h1>

          <p className="mt-3 max-w-lg text-sm text-muted-foreground">
            A registered traveler profile has been created for you. Verified DTS-licensed travel agencies are now preparing competitive custom quotes for your trip.
          </p>

          {/* Account & Notification Summary Card */}
          <div className="mt-6 w-full max-w-md rounded-2xl border border-border bg-card/90 p-5 text-left shadow-lg backdrop-blur space-y-3.5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Traveler Portal Access
              </span>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                Active Account
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Login Email:</span>
                <span className="font-semibold text-foreground font-mono">{form.contactEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-semibold text-foreground">{(form.destinations || []).join(", ")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">WhatsApp Confirmation:</span>
                <span className="font-semibold text-emerald-400 font-mono">+92 {form.contactPhone}</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
              💬 We have dispatched an initial confirmation message with your trip summary and login details to your <strong>WhatsApp</strong>.
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate({ to: "/auth", search: { mode: "signin", redirect: "/customer" } as never })}
              className="gap-2 bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90"
            >
              Go to Traveler Portal &amp; Login
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setStep(0);
                setForm(INITIAL);
              }}
            >
              Submit Another Request
            </Button>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">
            <span className="text-base leading-none">👑</span>
            Exclusive Custom Tour
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Build your dream itinerary
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fill in 4 quick steps and get quotes from verified Pakistani travel
            experts.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.label}>
                  {i > 0 && (
                    <div
                      className={`mx-1 h-0.5 flex-1 rounded-full transition-colors duration-300 ${done ? "bg-primary" : "bg-border"}`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    className={`group flex flex-col items-center gap-1.5 transition-colors ${
                      active
                        ? "text-primary"
                        : done
                          ? "cursor-pointer text-primary/70 hover:text-primary"
                          : "cursor-default text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`grid size-10 place-items-center rounded-xl border-2 transition-all duration-300 sm:size-12 ${
                        active
                          ? "border-primary bg-primary/15 shadow-glow"
                          : done
                            ? "border-primary/50 bg-primary/10"
                            : "border-border bg-surface"
                      }`}
                    >
                      {done ? (
                        <Check className="size-5 text-primary" />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </div>
                    <span className="hidden text-[11px] font-semibold uppercase tracking-wider sm:block">
                      {s.label}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          {/* Step 1: Logistics */}
          {step === 0 && (
            <div className="space-y-6">
              <StepHeader
                icon={MapPin}
                title="Trip Logistics"
                subtitle="Where are you coming from, where do you want to go?"
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Departure City" icon={MapPin}>
                  <Select
                    value={form.departureCity}
                    onValueChange={(v) => {
                      set("departureCity", v);
                      if (v !== "__other__") set("customCity", "");
                    }}
                  >
                    <SelectTrigger className="h-11 border-border bg-surface">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAKISTAN_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                      <SelectItem value="__other__">Other…</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.departureCity === "__other__" && (
                    <Input
                      value={form.customCity}
                      onChange={(e) => set("customCity", e.target.value)}
                      placeholder="Enter your city name"
                      className="mt-2 h-11 border-border bg-surface"
                      autoFocus
                    />
                  )}
                </FormField>

                <FormField label="Destination(s)" icon={MapPin} className="sm:col-span-2">
                  {/* Selected chips */}
                  {(form.destinations || []).length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {(form.destinations || []).map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          {d}
                          <button
                            type="button"
                            onClick={() =>
                              set(
                                "destinations",
                                (form.destinations || []).filter((x) => x !== d)
                              )
                            }
                            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Popular destinations grid */}
                  <div className="flex flex-wrap gap-1.5">
                    {(DESTINATIONS || []).filter((d) => !(form.destinations || []).includes(d)).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          set("destinations", [...(form.destinations || []), d])
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                      >
                        <Plus className="size-3" />
                        {d}
                      </button>
                    ))}
                  </div>
                  {/* Custom destination input */}
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={form.customDestination}
                      onChange={(e) => set("customDestination", e.target.value)}
                      placeholder="Or type any other country…"
                      className="h-9 border-border bg-surface text-xs"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          form.customDestination.trim() &&
                          !(form.destinations || []).includes(form.customDestination.trim())
                        ) {
                          e.preventDefault();
                          set("destinations", [
                            ...(form.destinations || []),
                            form.customDestination.trim(),
                          ]);
                          set("customDestination", "");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 shrink-0 text-xs"
                      disabled={
                        !form.customDestination.trim() ||
                        (form.destinations || []).includes(form.customDestination.trim())
                      }
                      onClick={() => {
                        set("destinations", [
                          ...(form.destinations || []),
                          form.customDestination.trim(),
                        ]);
                        set("customDestination", "");
                      }}
                    >
                      <Plus className="size-3.5 mr-1" />
                      Add
                    </Button>
                  </div>
                </FormField>

                <FormField label="Travel Month" icon={CalendarDays}>
                  <Select
                    value={form.travelMonth}
                    onValueChange={(v) => set("travelMonth", v)}
                  >
                    <SelectTrigger className="h-11 border-border bg-surface">
                      <SelectValue placeholder="Pick a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Duration"
                  icon={Clock}
                  trailing={
                    <span className="text-xs tabular-nums text-primary">
                      {form.durationDays} days · {form.durationDays - 1} nights
                    </span>
                  }
                >
                  <div className="flex h-11 items-center rounded-md border border-border bg-surface px-3">
                    <Slider
                      value={[form.durationDays]}
                      min={3}
                      max={21}
                      step={1}
                      onValueChange={([v]) => set("durationDays", v)}
                    />
                  </div>
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2: Group */}
          {step === 1 && (
            <div className="space-y-6">
              <StepHeader
                icon={Users}
                title="Group Details"
                subtitle="How many travelers, and what kind of group?"
              />

              <FormField
                label="Group Size"
                icon={Users}
                trailing={
                  <span className="text-xs tabular-nums text-primary">
                    {form.groupSize}{" "}
                    {form.groupSize === 1 ? "person" : "people"}
                  </span>
                }
              >
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-11 shrink-0"
                    disabled={form.groupSize <= 1}
                    onClick={() =>
                      set("groupSize", Math.max(1, form.groupSize - 1))
                    }
                  >
                    −
                  </Button>
                  <div className="flex h-11 flex-1 items-center rounded-md border border-border bg-surface px-3">
                    <Slider
                      value={[form.groupSize]}
                      min={1}
                      max={30}
                      step={1}
                      onValueChange={([v]) => set("groupSize", v)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-11 shrink-0"
                    disabled={form.groupSize >= 30}
                    onClick={() =>
                      set("groupSize", Math.min(30, form.groupSize + 1))
                    }
                  >
                    +
                  </Button>
                </div>
              </FormField>

              <FormField label="Group Type" icon={Users}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      { value: "family", label: "👨‍👩‍👧‍👦 Family", desc: "Parents & kids" },
                      { value: "friends", label: "🎉 Friends", desc: "Travel buddies" },
                      { value: "corporate", label: "💼 Corporate", desc: "Business trip" },
                      { value: "solo", label: "🧳 Solo", desc: "Just me" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("groupType", opt.value)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        form.groupType === opt.value
                          ? "border-primary bg-primary/10 shadow-glow"
                          : "border-border bg-surface hover:border-primary/30"
                      }`}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {/* Step 3: Services */}
          {step === 2 && (
            <div className="space-y-6">
              <StepHeader
                icon={Hotel}
                title="Preferred Services"
                subtitle="Customize your accommodation, flights, and add-ons."
              />

              <FormField label="Hotel Tier" icon={Hotel}>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { value: "3star", label: "⭐⭐⭐", desc: "Comfort" },
                      { value: "4star", label: "⭐⭐⭐⭐", desc: "Premium" },
                      { value: "5star", label: "⭐⭐⭐⭐⭐", desc: "Luxury" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("hotelTier", opt.value)}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${
                        form.hotelTier === opt.value
                          ? "border-primary bg-primary/10 shadow-glow"
                          : "border-border bg-surface hover:border-primary/30"
                      }`}
                    >
                      <p className="text-sm">{opt.label}</p>
                      <p className="mt-1 text-xs font-semibold">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Flight Class" icon={Plane}>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: "economy", label: "✈️ Economy", desc: "Standard seating" },
                      { value: "business", label: "🥂 Business", desc: "Premium cabin" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("flightClass", opt.value)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        form.flightClass === opt.value
                          ? "border-primary bg-primary/10 shadow-glow"
                          : "border-border bg-surface hover:border-primary/30"
                      }`}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleCard
                  icon={FileCheck}
                  label="Visa Assistance"
                  desc="Help with visa application & documents"
                  active={form.visaNeeded}
                  onToggle={() => set("visaNeeded", !form.visaNeeded)}
                />
                <ToggleCard
                  icon={Shield}
                  label="Travel Insurance"
                  desc="Medical & trip cancellation coverage"
                  active={form.insuranceNeeded}
                  onToggle={() =>
                    set("insuranceNeeded", !form.insuranceNeeded)
                  }
                />
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 3 && (
            <div className="space-y-6">
              <StepHeader
                icon={User}
                title="Your Contact Info"
                subtitle="So vendors can reach you with their best quotes."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Full Name" icon={User}>
                  <Input
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                    placeholder="Ahmed Khan"
                    className="h-11 border-border bg-surface"
                  />
                </FormField>

                <FormField label="Phone Number" icon={Phone}>
                  <div className="flex h-11 items-center rounded-md border border-border bg-surface">
                    <span className="flex h-full items-center border-r border-border bg-surface/80 px-3 text-xs font-semibold text-muted-foreground">
                      +92
                    </span>
                    <Input
                      value={form.contactPhone}
                      onChange={(e) => set("contactPhone", e.target.value)}
                      placeholder="3001234567"
                      className="h-full border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                  </div>
                </FormField>

                <FormField label="Email Address" icon={Mail} className="sm:col-span-2">
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => set("contactEmail", e.target.value)}
                    placeholder="ahmed@example.com"
                    className="h-11 border-border bg-surface"
                  />
                </FormField>

                {user ? (
                  <div className="sm:col-span-2 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                    <BadgeCheck className="size-4 shrink-0" />
                    <span>
                      Signed in as <strong>{user.email}</strong> — Custom quotes will be attached directly to your active Traveler Portal.
                    </span>
                  </div>
                ) : (
                  <FormField
                    label="Create Account Password*"
                    icon={Lock}
                    className="sm:col-span-2"
                    trailing={<span className="text-[10px] text-muted-foreground">Min. 6 characters</span>}
                  >
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => set("password", e.target.value)}
                        placeholder="Choose a password for your Traveler Portal (e.g. Travel@2026)"
                        className="h-11 border-border bg-surface pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      🛡️ Setting a password registers your <strong>Traveler Profile</strong> so you can log in, track quote status, and compare agency bids online.
                    </p>
                  </FormField>
                )}

                <FormField
                  label="Special Requests"
                  icon={MessageSquare}
                  className="sm:col-span-2"
                >
                  <Textarea
                    value={form.specialRequests}
                    onChange={(e) => set("specialRequests", e.target.value)}
                    placeholder="Any dietary requirements, wheelchair access, specific hotels, budget constraints..."
                    rows={3}
                    className="border-border bg-surface"
                  />
                </FormField>
              </div>

              {/* Summary preview */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sparkles className="size-4" />
                  Your Request Summary
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  <SummaryItem label="From" value={effectiveCity} />
                  <SummaryItem label="To" value={(form.destinations || []).join(", ")} />
                  <SummaryItem label="When" value={form.travelMonth} />
                  <SummaryItem
                    label="Duration"
                    value={`${form.durationDays} days`}
                  />
                  <SummaryItem
                    label="Group"
                    value={`${form.groupSize} · ${form.groupType}`}
                  />
                  <SummaryItem label="Hotel" value={form.hotelTier.replace("star", "★")} />
                  <SummaryItem label="Flight" value={form.flightClass} />
                  <SummaryItem
                    label="Visa"
                    value={form.visaNeeded ? "Yes" : "No"}
                  />
                  <SummaryItem
                    label="Insurance"
                    value={form.insuranceNeeded ? "Yes" : "No"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <div className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </div>

            <Button
              type="button"
              size="lg"
              onClick={handleNext}
              disabled={!canProceed() || mutation.isPending}
              className="gap-2 bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"
            >
              {mutation.isPending ? (
                "Submitting…"
              ) : step === 3 ? (
                <>
                  Submit Request
                  <Check className="size-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

/* ---------- Shared sub-components ---------- */

function StepHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4 pb-2">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon: Icon,
  trailing,
  className,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  trailing?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="size-3.5" />}
          {label}
        </span>
        {trailing}
      </span>
      {children}
    </label>
  );
}

function ToggleCard({
  icon: Icon,
  label,
  desc,
  active,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-surface hover:border-primary/30"
      }`}
    >
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? "bg-primary/20" : "bg-muted"}`}
      >
        <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <div
        className={`ml-auto mt-1 size-5 shrink-0 rounded-full border-2 transition-colors ${
          active ? "border-primary bg-primary" : "border-border"
        }`}
      >
        {active && <Check className="size-full p-0.5 text-white" />}
      </div>
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="font-medium capitalize">{value || "—"}</p>
    </div>
  );
}

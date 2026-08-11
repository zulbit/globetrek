import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileCheck2,
  AlertTriangle,
  Building2,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Plane,
  HeartHandshake,
  MessageCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POPULAR_VISA_COUNTRIES, PAKISTAN_CITIES } from "@/lib/services";
import { formatAndLimitPhone, validatePhone } from "@/lib/phone";
import { supabase } from "@/integrations/supabase/client";
import { submitCustomVisaLead } from "@/lib/custom-visa-leads.functions";

export const Route = createFileRoute("/custom-visa")({
  component: CustomVisaPage,
  head: () => ({
    meta: [
      {
        title: "Custom Visa Consultation, Embassy Filing & Rejection Handling — GlobeTrek PK",
      },
      {
        name: "description",
        content:
          "Overcome visa rejections or get expert file preparation for UK, Schengen, USA, Canada, Turkey & UAE. Receive up to 5 competitive proposals from verified Pakistani visa consultants.",
      },
      {
        property: "og:title",
        content: "Custom Visa Consultation & Refusal Handling — GlobeTrek PK",
      },
      {
        property: "og:description",
        content:
          "Expert bank statement advisory, Gerry's/VFS drop-box guidance, and interview prep from Pakistan's top visa lawyers and agencies.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globetrek.pk/custom-visa" },
      { property: "og:image", content: "https://globetrek.pk/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://globetrek.pk/custom-visa" }],
  }),
});

const VISA_CATEGORIES = [
  { id: "tourist", label: "Tourist / Holiday Visa", icon: "🌴", desc: "Sightseeing, vacations & tourism" },
  { id: "family_visit", label: "Family & Friend Visit", icon: "👨‍👩‍👧‍👦", desc: "Visiting relatives / sponsor abroad" },
  { id: "business", label: "Business & Conference", icon: "💼", desc: "Trade expos, meetings & commercial" },
  { id: "student", label: "Student & Study Visa", icon: "🎓", desc: "University admission, CAS & I-20" },
  { id: "umrah", label: "Umrah / Religious Visa", icon: "🕋", desc: "Saudi Arabia individual / group" },
  { id: "work", label: "Work / Employment Advisory", icon: "🏢", desc: "Job seeker & employment filing" },
  { id: "transit", label: "Transit Visa", icon: "✈️", desc: "Airport layover & connecting flights" },
];

const CASE_NATURES = [
  {
    id: "standard",
    label: "Standard Visa Application",
    badge: "🟢 Regular Filing",
    desc: "Standard application & document file review",
  },
  {
    id: "fresh_passport",
    label: "First-Time International Travel",
    badge: "🟢 Fresh Passport",
    desc: "Building a strong file with zero prior travel history",
  },
  {
    id: "previous_refusal",
    label: "Previous Visa Refusal / Re-Application",
    badge: "🔴 Rejection Case",
    desc: "Rectifying past refusals (Schengen, UK, US, Canada)",
  },
  {
    id: "interview_prep",
    label: "Interview Prep & Appointment Booking",
    badge: "🔵 Fast-Track",
    desc: "Consulate mock interview & urgent slot assistance",
  },
];

const APPLICANT_PROFILES = [
  "Salaried Professional (Private / MNC)",
  "Business Owner / Company Director",
  "Freelancer / Remote Tech Worker",
  "Doctor / Healthcare Professional",
  "Engineer / Technical Specialist",
  "Student / Recent Graduate",
  "Government Officer / Armed Forces",
  "Self-Employed / Freelance Consultant",
];

const SUBMISSION_CENTERS = [
  "Gerry's Visa Drop Box (Islamabad)",
  "Gerry's Visa Drop Box (Lahore)",
  "Gerry's Visa Drop Box (Karachi)",
  "Gerry's Visa Drop Box (Peshawar)",
  "Gerry's Visa Drop Box (Faisalabad)",
  "VFS Global Center (Islamabad)",
  "VFS Global Center (Lahore)",
  "VFS Global Center (Karachi)",
  "Anatolia Visa Center (Turkey Centers)",
  "Direct Embassy Interview (Islamabad)",
  "Direct Consulate Interview (Karachi)",
  "Online E-Visa (Self / Portal Submission)",
];

function CustomVisaPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Form State
  const [destinationCountry, setDestinationCountry] = React.useState("United Kingdom");
  const [visaCategory, setVisaCategory] = React.useState("Tourist / Holiday Visa");
  const [caseNature, setCaseNature] = React.useState("Standard Visa Application");
  const [hasPriorRejection, setHasPriorRejection] = React.useState(false);
  const [rejectionDetails, setRejectionDetails] = React.useState("");
  const [applicantProfile, setApplicantProfile] = React.useState("Salaried Professional (Private / MNC)");
  const [bankStatementStatus, setBankStatementStatus] = React.useState("Strong (6+ months maintained with FBR Filer)");
  const [submissionOffice, setSubmissionOffice] = React.useState("Gerry's Visa Drop Box (Islamabad)");
  const [consultationMode, setConsultationMode] = React.useState("Any (Best Price & Service)");
  const [targetTravelDate, setTargetTravelDate] = React.useState("");
  const [applicantCount, setApplicantCount] = React.useState(1);
  const [specialNotes, setSpecialNotes] = React.useState("");

  // Contact Info
  const [contactName, setContactName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [customerCity, setCustomerCity] = React.useState("Islamabad");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Auto-Prefill Contact for Logged-In Users
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedName = localStorage.getItem("globetrek_contact_name");
      const cachedPhone = localStorage.getItem("globetrek_contact_phone");
      if (cachedName) setContactName(cachedName);
      if (cachedPhone) setContactPhone(cachedPhone);
    }

    async function loadUserData() {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        setIsLoggedIn(true);

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, city")
          .eq("id", u.user.id)
          .maybeSingle();

        if (profile?.full_name && !contactName) setContactName(profile.full_name);
        if (profile?.email && !contactEmail) setContactEmail(profile.email);
        if (profile?.city && !customerCity) setCustomerCity(profile.city);
      } catch (e) {
        console.warn("Auto-prefill error:", e);
      }
    }

    loadUserData();
  }, []);

  // When Case Nature changes, auto-toggle hasPriorRejection
  React.useEffect(() => {
    if (caseNature.includes("Previous Visa Refusal")) {
      setHasPriorRejection(true);
    }
  }, [caseNature]);

  // Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!contactName.trim()) throw new Error("Please enter your full name");
      const phoneVal = validatePhone(contactPhone);
      if (!phoneVal.isValid) throw new Error(phoneVal.error);

      if (typeof window !== "undefined") {
        localStorage.setItem("globetrek_contact_name", contactName.trim());
        localStorage.setItem("globetrek_contact_phone", phoneVal.formatted);
      }

      return await submitCustomVisaLead({
        data: {
          contact_name: contactName.trim(),
          contact_phone: phoneVal.formatted,
          contact_email: contactEmail.trim() || "traveler@globetrek.pk",
          customer_city: customerCity,
          destination_country: destinationCountry,
          visa_category: visaCategory,
          case_nature: caseNature,
          has_prior_rejection: hasPriorRejection,
          rejection_details: hasPriorRejection ? rejectionDetails : undefined,
          applicant_profile: applicantProfile,
          bank_statement_status: bankStatementStatus,
          submission_office: submissionOffice,
          consultation_mode: consultationMode,
          target_travel_date: targetTravelDate || undefined,
          applicant_count: applicantCount,
          special_notes: specialNotes || undefined,
          password: password.trim().length >= 6 ? password.trim() : undefined,
        },
      });
    },
    onSuccess: async (res) => {
      // Auto login if new account password was provided
      if (password && password.trim().length >= 6 && contactEmail) {
        try {
          await supabase.auth.signInWithPassword({
            email: contactEmail.trim(),
            password: password.trim(),
          });
        } catch (authErr) {
          console.warn("Auto login notice:", authErr);
        }
      }

      toast.success("🎉 Visa Consultation Request Submitted!", {
        description: "Your case file is active in your Traveler Hub! Up to 5 verified consultants are preparing bids.",
        duration: 6000,
      });
      navigate({
        to: "/customer/visa-quotes" as any,
        search: { token: res.leadId } as any,
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit visa consultation request");
    },
  });

  return (
    <SiteShell>
      <div className="relative min-h-[85vh] bg-gradient-to-b from-card/60 via-background to-background py-10 sm:py-16">
        {/* Glow Accents */}
        <div className="pointer-events-none absolute left-1/3 top-12 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-36 -z-10 h-72 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-bold text-rose-400">
              <Sparkles className="size-3.5" />
              <span>Free Custom Case Evaluation · Up to 5 Expert Bids</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Custom Visa Advisory &amp;{" "}
              <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                Refusal Rectification
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              Submit your case details to receive competitive proposals from Pakistan's top verified
              visa consultants, former embassy officers, and appeal lawyers.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="mt-10 mb-8 flex items-center justify-center gap-2 sm:gap-4">
            {[
              { num: 1, label: "Destination & Category" },
              { num: 2, label: "Case & Office Profile" },
              { num: 3, label: "Contact Details" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => s.num < step && setStep(s.num as any)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    step === s.num
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : step > s.num
                      ? "bg-surface border border-emerald-500/30 text-emerald-400"
                      : "bg-surface/50 text-muted-foreground border border-border"
                  }`}
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-black/20 text-[11px] font-bold">
                    {step > s.num ? "✓" : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < 2 && <div className="h-0.5 w-4 bg-border sm:w-8" />}
              </div>
            ))}
          </div>

          {/* Main Form Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl backdrop-blur-md sm:p-10">
            {/* STEP 1: DESTINATION & VISA CATEGORY */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-border pb-4">
                  <h3 className="text-lg font-bold text-foreground">
                    Step 1: Where do you want to travel &amp; what visa do you need?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select your destination country and the specific type of visa required.
                  </p>
                </div>

                {/* Country Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" /> Destination Country
                  </label>
                  <Select value={destinationCountry} onValueChange={setDestinationCountry}>
                    <SelectTrigger className="h-12 text-sm bg-surface border-border">
                      <SelectValue placeholder="Select Destination Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {POPULAR_VISA_COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-sm font-medium">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Visa Category Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Plane className="size-3.5 text-primary" /> Type of Visa Required
                  </label>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {VISA_CATEGORIES.map((cat) => {
                      const isSelected = visaCategory === cat.label;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setVisaCategory(cat.label)}
                          className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                              : "border-border bg-surface/50 hover:bg-surface hover:border-border/80"
                          }`}
                        >
                          <span className="text-2xl leading-none">{cat.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">{cat.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{cat.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Intended Travel Date & Number of Applicants */}
                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-primary" /> Intended Travel Date / Timeline
                    </label>
                    <Input
                      type="date"
                      value={targetTravelDate}
                      onChange={(e) => setTargetTravelDate(e.target.value)}
                      className="h-12 bg-surface border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" /> Number of Applicants
                    </label>
                    <Select
                      value={applicantCount.toString()}
                      onValueChange={(v) => setApplicantCount(Number(v) || 1)}
                    >
                      <SelectTrigger className="h-12 bg-surface border-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Applicant (Individual)</SelectItem>
                        <SelectItem value="2">2 Applicants (Couple / Pair)</SelectItem>
                        <SelectItem value="3">3 Applicants (Small Family)</SelectItem>
                        <SelectItem value="4">4 Applicants (Family)</SelectItem>
                        <SelectItem value="5">5+ Applicants (Group / Corporate)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Next Button */}
                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={() => setStep(2)}
                    className="gap-2 bg-primary text-primary-foreground font-bold shadow-glow"
                  >
                    <span>Next: Case &amp; Submission Profile</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: CASE PROFILE, REJECTION & SUBMISSION OFFICE */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-border pb-4">
                  <h3 className="text-lg font-bold text-foreground">
                    Step 2: Tell us about your case history &amp; preferred submission office
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Helps consultants tailor document checklists, cover letters, and fee estimates.
                  </p>
                </div>

                {/* Case Nature Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="size-3.5 text-primary" /> Case Nature &amp; History
                  </label>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {CASE_NATURES.map((cn) => {
                      const isSelected = caseNature === cn.label;
                      return (
                        <div
                          key={cn.id}
                          onClick={() => {
                            setCaseNature(cn.label);
                            if (cn.id === "previous_refusal") setHasPriorRejection(true);
                            else setHasPriorRejection(false);
                          }}
                          className={`rounded-2xl border p-3.5 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                              : "border-border bg-surface/50 hover:bg-surface hover:border-border/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-foreground">{cn.label}</p>
                            <span className="text-[10px] font-bold">{cn.badge}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">{cn.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* If Prior Rejection, prompt for details */}
                {hasPriorRejection && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2 animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="size-4" /> Past Refusal Reason / Clause (Optional but Recommended)
                    </label>
                    <Input
                      value={rejectionDetails}
                      onChange={(e) => setRejectionDetails(e.target.value)}
                      placeholder="e.g. UK refused under V4.2 / Schengen Clause 2/13 / US Section 214(b)"
                      className="bg-surface border-rose-500/30"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Our verified appeal consultants will draft tailored legal justification letters addressing this specific clause.
                    </p>
                  </div>
                )}

                {/* 2-Column: Applicant Profile & Bank Statement */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Applicant Employment Profile
                    </label>
                    <Select value={applicantProfile} onValueChange={setApplicantProfile}>
                      <SelectTrigger className="h-11 bg-surface border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICANT_PROFILES.map((p) => (
                          <SelectItem key={p} value={p} className="text-xs">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Bank Statement Readiness
                    </label>
                    <Select value={bankStatementStatus} onValueChange={setBankStatementStatus}>
                      <SelectTrigger className="h-11 bg-surface border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Strong (6+ months maintained with FBR Filer)" className="text-xs">
                          Strong (6+ months maintained with FBR Filer)
                        </SelectItem>
                        <SelectItem value="Average (3-6 months statement available)" className="text-xs">
                          Average (3-6 months statement available)
                        </SelectItem>
                        <SelectItem value="Needs Advice / Financial File Planning" className="text-xs">
                          Needs Advice / Financial File Planning
                        </SelectItem>
                        <SelectItem value="Sponsor / Family Guaranteed Funds" className="text-xs">
                          Sponsor / Family Guaranteed Funds
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Submission Center & Preferred Mode */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-primary" /> Submission Center / Office
                    </label>
                    <Select value={submissionOffice} onValueChange={setSubmissionOffice}>
                      <SelectTrigger className="h-11 bg-surface border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBMISSION_CENTERS.map((sc) => (
                          <SelectItem key={sc} value={sc} className="text-xs">
                            {sc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Preferred Consultation Mode
                    </label>
                    <Select value={consultationMode} onValueChange={setConsultationMode}>
                      <SelectTrigger className="h-11 bg-surface border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In-Person Office Visit in My City" className="text-xs">
                          🏢 In-Person Office Visit in My City
                        </SelectItem>
                        <SelectItem value="Online / WhatsApp Remote E-Filing is Fine" className="text-xs">
                          🌐 Online / WhatsApp Remote E-Filing is Fine
                        </SelectItem>
                        <SelectItem value="Any (Best Price & Service)" className="text-xs">
                          ⚡ Any (Best Price & Service)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Specific Questions or Case Notes (Optional)
                  </label>
                  <Textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Need urgent VFS appointment slot, family of 3 traveling together, interview coaching requested..."
                    className="bg-surface border-border text-xs"
                  />
                </div>

                {/* Stepper Buttons */}
                <div className="pt-4 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setStep(3)}
                    className="gap-2 bg-primary text-primary-foreground font-bold shadow-glow"
                  >
                    <span>Next: Your Contact Details</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: CONTACT & INSTANT DISPATCH */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-border pb-4">
                  <h3 className="text-lg font-bold text-foreground">
                    Step 3: Where should consultants send your proposals?
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your details are shared confidentially with up to 5 verified Pakistani consultants.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {destinationCountry} · {visaCategory}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {caseNature} · {submissionOffice}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                    5 Expert Proposals
                  </span>
                </div>

                {/* Contact Inputs */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="size-3.5 text-primary" /> Full Name
                    </label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Muhammad Farooq"
                      className="bg-surface border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Phone className="size-3.5 text-primary" /> WhatsApp Mobile Number
                      </label>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {contactPhone.length}/13
                      </span>
                    </div>
                    <Input
                      value={contactPhone}
                      maxLength={13}
                      onChange={(e) => setContactPhone(formatAndLimitPhone(e.target.value))}
                      placeholder="+923001234567"
                      inputMode="tel"
                      className="bg-surface border-border text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3.5 text-primary" /> Email Address
                    </label>
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. farooq@example.com"
                      className="bg-surface border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" /> Your Resident City
                    </label>
                    <Select value={customerCity} onValueChange={setCustomerCity}>
                      <SelectTrigger className="h-10 bg-surface border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAKISTAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city} className="text-xs">
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Account Password for Guest Users */}
                {!isLoggedIn && (
                  <div className="space-y-1.5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Lock className="size-3.5 text-primary" /> Create Account Password
                      </label>
                      <span className="text-[10px] text-muted-foreground">Min 6 characters</span>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Set a password to manage bids in your Traveler Hub"
                        className="bg-surface border-border text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Creates your free <strong>Traveler Hub</strong> account so you can log in, track incoming visa proposals, and chat directly with bidding consultants.
                    </p>
                  </div>
                )}

                {/* Trust notice */}
                <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/50 p-3.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-5 shrink-0 text-emerald-400" />
                  <span>
                    <strong>100% Free &amp; Zero Obligation:</strong> You will receive quotes on WhatsApp &amp; in your Traveler Portal. You choose the consultant you like best.
                  </span>
                </div>

                {/* Final Submit */}
                <div className="pt-4 flex items-center justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <Button
                    size="lg"
                    disabled={submitMutation.isPending}
                    onClick={() => submitMutation.mutate()}
                    className="gap-2 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 px-8 font-bold text-white shadow-glow hover:scale-[1.02] transition-transform"
                  >
                    <FileCheck2 className="size-5" />
                    <span>{submitMutation.isPending ? "Submitting Case..." : "Get 5 Expert Visa Bids"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Frequently Asked Questions (Custom Visa & Refusal Handling) */}
          <div className="mt-16 space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-xs font-bold">
                💡 Traveler Assistance
              </Badge>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                Frequently Asked Questions About Custom Visa Filing &amp; Refusals
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Everything you need to know about refusal appeals, drop-box submission centers, and verified consultant proposals.
              </p>
            </div>

            <div className="grid gap-3.5 pt-2">
              {[
                {
                  q: "My visa was previously refused (UK, Schengen, US, Canada). Can I get approved on re-applying?",
                  a: "Yes! A majority of visa refusals occur due to ambiguous cover letters, unexplained bulk bank deposits, or weak home-country tie-backs. Verified appeal specialists on GlobeTrek PK analyze your exact refusal letter (e.g. Paragraph V4.2(a)/(c) for UK, INA 214(b) for US, or Schengen Purpose of Stay), address the visa officer's specific objections with documentary proof, and restructure your application to maximize approval chances.",
                },
                {
                  q: "How does the 5-Proposal Limit protect me as an applicant?",
                  a: "To protect your privacy and prevent unsolicited spam, GlobeTrek PK strictly caps each case to a maximum of 5 unlocking agencies. This gives you enough competitive quotes and strategy options to make an informed decision without your WhatsApp being flooded by dozens of agents.",
                },
                {
                  q: "I live in Islamabad / Lahore / Karachi. Can I visit the consultant's office in-person?",
                  a: "Absolutely. In Step 2 of the form, you can select 'In-Person Office Visit in My City'. Consultants located in your city will see a '📍 Local Client' priority badge and will welcome you to their physical office for document file audits and biometric slot coordination.",
                },
                {
                  q: "What services are included in the consultant proposals?",
                  a: "Proposals typically cover: Complete Document File Audit, Embassy Cover Letter Drafting, Gerry's / VFS Global / Anatolia Appointment Slot Booking, Bank Statement Tie-Back Review, FBR Tax Return Verification, Schengen Travel Insurance, Hotel/Flight Reservations, and 1-on-1 Mock Interview Preparation.",
                },
                {
                  q: "Is there any upfront fee for me to submit a consultation request?",
                  a: "No! Submitting your case request on GlobeTrek PK is 100% Free and Zero Obligation. You receive up to 5 competitive proposals in your Traveler Hub and on WhatsApp, and you only pay the service fee agreed with your chosen agency.",
                },
              ].map((faq, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl border border-border bg-card/80 p-4 transition-all duration-200 hover:border-primary/40 open:border-primary/40 open:bg-surface/60"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-xs sm:text-sm text-foreground list-none select-none">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="size-4 text-primary shrink-0" />
                      {faq.q}
                    </span>
                    <span className="ml-2 size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold transition-transform group-open:rotate-180 shrink-0">
                      ▾
                    </span>
                  </summary>
                  <div className="mt-3 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground pl-6">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

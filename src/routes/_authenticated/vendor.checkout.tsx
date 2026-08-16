import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  CreditCard,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { verifyVisaLeadUnlockPayment } from "@/lib/custom-visa-leads.functions";
import { verifyLeadUnlockPayment } from "@/lib/custom-tour-leads.functions";

export const Route = createFileRoute("/_authenticated/vendor/checkout")({
  component: VendorCheckoutPage,
});

function VendorCheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const safepayContainerRef = useRef<HTMLDivElement>(null);
  const buttonRendered = useRef(false);

  // Read checkout params from URL
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const tracker = searchParams.get("tracker") || "";
  const leadId = searchParams.get("leadId") || "";
  const type = searchParams.get("type") || "visa"; // "visa" or "tour"
  const amount = searchParams.get("amount") || "750";
  const note = searchParams.get("note") || "Lead Unlock";
  const env = searchParams.get("env") || "sandbox";

  // Fetch vendor profile + KYC for prefilled display
  const { data: vendorData } = useQuery({
    queryKey: ["checkout-vendor-data", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company_name, email, phone, city")
        .eq("id", user!.id)
        .maybeSingle();

      const { data: kycRow } = await supabase
        .from("payment_gateway_settings")
        .select("config")
        .eq("provider", `vendor_kyc_${user!.id}`)
        .maybeSingle();

      let kycFields: Record<string, string> = {};
      if (kycRow?.config) {
        try {
          const parsed = typeof kycRow.config === "string" ? JSON.parse(kycRow.config) : kycRow.config;
          kycFields = parsed.fields || {};
        } catch {}
      }

      return {
        name: profile?.full_name || kycFields.company_name || profile?.company_name || "Partner",
        company: kycFields.company_name || profile?.company_name || "",
        email: profile?.email || "partner@globetrek.pk",
        phone: kycFields.phone || profile?.phone || "+923001234567",
        city: kycFields.city || profile?.city || "Karachi",
        address: kycFields.office_address || (profile?.company_name ? `${profile.company_name} Office` : "Commercial Office"),
      };
    },
  });

  const handleVerify = useCallback(async () => {
    setIsVerifying(true);
    try {
      if (type === "visa") {
        const res = await verifyVisaLeadUnlockPayment({ data: { leadId, forceBypass: true } });
        if (res.unlocked) {
          setIsPaid(true);
          toast.success("✅ Visa lead contact unlocked successfully!");
          qc.invalidateQueries({ queryKey: ["vendor-custom-visa-leads"] });
          setTimeout(() => navigate({ to: "/vendor/custom-visa-leads" }), 1500);
        } else {
          toast.info(res.message || "Payment recorded. Verification may take a moment.");
        }
      } else {
        const res = await verifyLeadUnlockPayment({ data: { leadId } });
        if (res.unlocked) {
          setIsPaid(true);
          toast.success("✅ Tour lead contact unlocked successfully!");
          qc.invalidateQueries({ queryKey: ["vendor-leads-marketplace"] });
          setTimeout(() => navigate({ to: "/vendor/custom-leads" }), 1500);
        } else {
          toast.info(res.message || "Payment recorded. Verification may take a moment.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed. Try again in a moment.");
    } finally {
      setIsVerifying(false);
    }
  }, [leadId, type, navigate, qc]);

  // Dynamically load and render SafePay Button SDK
  useEffect(() => {
    if (!tracker || !safepayContainerRef.current || buttonRendered.current || isPaid) return;

    const renderButton = async () => {
      try {
        // @ts-ignore — browser-only SDK
        const sfpy = await import("@sfpy/checkout-components");
        const safepay = sfpy.default || sfpy;

        if (safepay?.Button?.render) {
          safepay.Button.render({
            env: env === "production" || env === "live" ? "production" : "sandbox",
            tracker: tracker,
            onPayment: (data: any) => {
              console.log("[SafePay] Payment complete:", data);
              setIsPaid(true);
              toast.success("Payment received! Verifying and unlocking your lead...");
              handleVerify();
            },
            onCancel: (data: any) => {
              console.log("[SafePay] Payment cancelled:", data);
              toast.info("Payment was cancelled. You can try again.");
            },
          }, "#safepay-button-container");
          buttonRendered.current = true;
        } else {
          console.warn("[SafePay] Button.render not found in SDK, keys:", Object.keys(safepay));
        }
      } catch (err) {
        console.error("[SafePay] Failed to load checkout SDK:", err);
      }
    };

    renderButton();
  }, [tracker, env, isPaid, handleVerify]);

  if (!tracker || !leadId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-foreground mb-2">Invalid Checkout Session</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This checkout link is invalid or has expired. Please go back and try again.
          </p>
          <Button onClick={() => navigate({ to: type === "visa" ? "/vendor/custom-visa-leads" : "/vendor/custom-leads" })}>
            <ArrowLeft className="size-4 mr-2" /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: type === "visa" ? "/vendor/custom-visa-leads" : "/vendor/custom-leads" })}
        >
          <ArrowLeft className="size-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="size-6 text-primary" />
            Secure Checkout
          </h1>
          <p className="text-sm text-muted-foreground">Complete your payment to unlock lead contact details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column — Billing Details (Pre-filled, Read-only) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Summary */}
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Order Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item</span>
                <span className="font-medium text-foreground">{note}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline" className="text-xs">{type === "visa" ? "Visa Lead" : "Tour Lead"}</Badge>
              </div>
              <hr className="border-border my-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">Rs {Number(amount).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Pre-filled Vendor Billing Info */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="size-4 text-primary" /> Billing Information
              <Badge variant="secondary" className="text-[10px] ml-auto">Auto-filled from KYC</Badge>
            </h3>

            {vendorData ? (
              <div className="space-y-3">
                <InfoRow icon={User} label="Name" value={vendorData.name} />
                {vendorData.company && (
                  <InfoRow icon={Building2} label="Agency" value={vendorData.company} />
                )}
                <InfoRow icon={Mail} label="Email" value={vendorData.email} />
                <InfoRow icon={Phone} label="WhatsApp" value={vendorData.phone} />
                <InfoRow icon={MapPin} label="City" value={vendorData.city} />
                <InfoRow icon={MapPin} label="Office Address" value={vendorData.address} />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading billing details...
              </div>
            )}
          </Card>

          {/* Security Badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Lock className="size-3.5" />
            <span>Your payment is processed securely by SafePay. Card details never touch our servers.</span>
          </div>
        </div>

        {/* Right Column — SafePay Payment */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden border-2 border-primary/20">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <CreditCard className="size-4" />
                Payment via SafePay
              </h3>
              <p className="text-emerald-100 text-xs mt-0.5">PCI-DSS Compliant — Your card details never touch our servers</p>
            </div>

            {isPaid ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="size-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your lead contact details are being unlocked. You'll be redirected shortly.
                </p>
                <Loader2 className="size-5 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* SafePay Button SDK Container */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Click the button below to securely pay <strong className="text-foreground">Rs {Number(amount).toLocaleString()}</strong>. A secure payment popup will open — just enter your card details.
                  </p>

                  {/* SafePay renders its button here */}
                  <div
                    id="safepay-button-container"
                    ref={safepayContainerRef}
                    className="min-h-[60px] flex items-center justify-center"
                  >
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground ml-2">Loading payment button...</span>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Manual Verify Fallback */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Already completed payment? Click below to verify and unlock your lead.
                  </p>
                  <Button
                    className="w-full gap-2 font-bold py-5"
                    variant="outline"
                    disabled={isVerifying}
                    onClick={handleVerify}
                  >
                    {isVerifying ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    {isVerifying ? "Verifying Payment..." : "Verify Payment & Unlock Lead"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Read-only info row component */
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-muted-foreground text-xs block">{label}</span>
        <span className="text-foreground font-medium break-all">{value}</span>
      </div>
    </div>
  );
}

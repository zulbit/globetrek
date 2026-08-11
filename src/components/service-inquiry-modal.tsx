import * as React from "react";
import { Phone, MessageCircle, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ServiceType } from "@/lib/services";

import { formatAndLimitPhone, validatePhone } from "@/lib/phone";

export function ServiceInquiryModal({
  serviceType,
  serviceId,
  serviceTitle,
  vendorName,
  trigger,
  channel = "whatsapp",
}: {
  serviceType: ServiceType;
  serviceId: string;
  serviceTitle: string;
  vendorName?: string;
  trigger: React.ReactNode;
  channel?: "whatsapp" | "callback";
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  // Auto-prefill name and phone when modal opens for logged in customers
  React.useEffect(() => {
    if (!open) return;

    if (typeof window !== "undefined") {
      const cachedName = localStorage.getItem("globetrek_contact_name");
      const cachedPhone = localStorage.getItem("globetrek_contact_phone");
      if (cachedName) setName((prev) => prev || cachedName);
      if (cachedPhone) setPhone((prev) => prev || cachedPhone);
    }

    async function loadUserData() {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;

        // 1. Profile lookup
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", u.user.id)
          .maybeSingle();

        const userFullName =
          profile?.full_name ||
          (u.user.user_metadata?.full_name as string) ||
          (u.user.user_metadata?.name as string) ||
          "";

        if (userFullName) {
          setName((prev) => prev || userFullName);
        }

        // 2. Query custom tour lead contact phone
        const userEmail = profile?.email || u.user.email;
        if (userEmail) {
          const { data: leadData } = await supabase
            .from("custom_tour_leads")
            .select("contact_name, contact_phone")
            .ilike("contact_email", userEmail)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (leadData?.contact_phone) {
            setPhone((prev) => prev || leadData.contact_phone);
          }
          if (leadData?.contact_name && !userFullName) {
            setName((prev) => prev || leadData.contact_name);
          }
        }

        // 3. Query previous catalog inquiry
        const { data: prevLead } = await supabase
          .from("leads")
          .select("customer_name, customer_phone")
          .eq("customer_id", u.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (prevLead?.customer_phone) {
          setPhone((prev) => prev || prevLead.customer_phone);
        }
        if (prevLead?.customer_name) {
          setName((prev) => prev || prevLead.customer_name);
        }
      } catch (err) {
        console.warn("Could not auto-prefill user contact info:", err);
      }
    }

    loadUserData();
  }, [open]);

  async function submit() {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error);
      return;
    }
    const cleanPhone = phoneValidation.formatted;

    if (typeof window !== "undefined") {
      localStorage.setItem("globetrek_contact_name", name.trim());
      localStorage.setItem("globetrek_contact_phone", cleanPhone);
    }

    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      // vendor_id is resolved by the resolve_lead_vendor trigger from service_id
      const { error } = await supabase.from("leads").insert({
        service_type: serviceType,
        service_id: serviceId,
        tour_id: serviceType === "tours" ? serviceId : null,
        vendor_id: null as unknown as string, // trigger will fill
        customer_id: u.user?.id ?? null,
        customer_name: name.trim(),
        customer_phone: cleanPhone,
        message: message.trim() || null,
      } as never);
      if (error) throw error;
      toast.success(
        channel === "whatsapp"
          ? "Inquiry sent — the provider will WhatsApp you shortly"
          : "Callback requested — the provider will call you shortly",
      );
      setOpen(false);
      setMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send inquiry");
    } finally {
      setBusy(false);
    }
  }

  const Icon = channel === "whatsapp" ? MessageCircle : Phone;
  const title = channel === "whatsapp" ? "Inquire on WhatsApp" : "Request a callback";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md border-border bg-card p-0 gap-0 overflow-hidden">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4 text-primary" /> {title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {serviceTitle}{vendorName ? ` · by ${vendorName}` : ""}
          </p>
        </DialogHeader>
        <div className="space-y-3 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="siq-name">Your name</Label>
            <Input id="siq-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ali Raza" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="siq-phone">Phone number</Label>
              <span className="text-[11px] font-mono text-muted-foreground">
                {phone.length}/13
              </span>
            </div>
            <Input
              id="siq-phone"
              value={phone}
              maxLength={13}
              onChange={(e) => setPhone(formatAndLimitPhone(e.target.value))}
              placeholder="+923001234567"
              inputMode="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="siq-msg">Message (optional)</Label>
            <Textarea id="siq-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Preferred dates, questions…" />
          </div>
          <p className="rounded-md border border-border bg-surface px-3 py-2 text-[11px] text-muted-foreground">
            Your contact details are shared only with this provider so they can send a quote.
          </p>
        </div>
        <DialogFooter className="border-t border-border p-5">
          <Button
            onClick={submit}
            disabled={busy}
            className="w-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90"
          >
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Icon className="mr-2 size-4" />}
            {channel === "whatsapp" ? "Send inquiry" : "Request callback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

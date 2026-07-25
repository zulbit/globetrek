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

  async function submit() {
    if (!name.trim() || !phone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
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
        customer_phone: phone.trim(),
        message: message.trim() || null,
      } as never);
      if (error) throw error;
      toast.success(
        channel === "whatsapp"
          ? "Inquiry sent — the provider will WhatsApp you shortly"
          : "Callback requested — the provider will call you shortly",
      );
      setOpen(false);
      setName(""); setPhone(""); setMessage("");
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
            <Label htmlFor="siq-phone">Phone number</Label>
            <Input id="siq-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 3XX XXXXXXX" inputMode="tel" />
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

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
import type { Tour } from "@/lib/tours";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function InquiryModal({
  tour,
  trigger,
  channel = "whatsapp",
}: {
  tour: Tour;
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
      // Only persist when the tour is a real database record.
      if (UUID_RE.test(tour.id)) {
        let targetVendorId = tour.vendor_id;
        if (!targetVendorId) {
          const { data: dbTour } = await supabase
            .from("tours")
            .select("vendor_id")
            .eq("id", tour.id)
            .maybeSingle();
          if (dbTour?.vendor_id) {
            targetVendorId = dbTour.vendor_id;
          }
        }

        if (targetVendorId) {
          const { data: u } = await supabase.auth.getUser();
          const { error } = await supabase.from("leads").insert({
            tour_id: tour.id,
            vendor_id: targetVendorId,
            customer_id: u.user?.id ?? null,
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            message: message.trim() || null,
          });
          if (error) throw error;
        }
      }
      toast.success(
        channel === "whatsapp"
          ? "Inquiry sent — the vendor will WhatsApp you shortly"
          : "Callback requested — the vendor will call you shortly",
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
            {tour.title} · by {tour.vendor}
          </p>
        </DialogHeader>

        <div className="space-y-3 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="iq-name">Your name</Label>
            <Input id="iq-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ali Raza" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iq-phone">Phone number</Label>
            <Input id="iq-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 3XX XXXXXXX" inputMode="tel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iq-msg">Message (optional)</Label>
            <Textarea id="iq-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Preferred dates, group size, questions…" />
          </div>
          <p className="rounded-md border border-border bg-surface px-3 py-2 text-[11px] text-muted-foreground">
            Your contact details are shared only with this vendor so they can send a quote.
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

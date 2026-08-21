import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Info, Save, RotateCcw, AlertTriangle, Plus, Trash2, Wifi, WifiOff, RefreshCw, Image as ImageIcon, Upload, Send, Key, Check, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getWhatsAppConnection, sendWhatsAppMessage, DEFAULT_GLOBETREK_TEMPLATES } from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/_authenticated/admin/whatsapp")({
  component: AdminWhatsAppConsole,
});

type Template = {
  id: string;
  name: string;
  description: string | null;
  body: string;
  variables: string[];
  recipient: string;
  image_url: string | null;
  updated_at: string;
};

// Preset available variable chips tailored for GlobeTrek PK
const PRESET_VARIABLES = [
  "customer_name",
  "destination",
  "departure_city",
  "travel_month",
  "duration_days",
  "group_size",
  "group_type",
  "hotel_tier",
  "inclusions",
  "vendor_name",
  "company_name",
  "tour_title",
  "country",
  "visa_type",
  "price_pkr",
  "phone",
  "email",
  "referral_code",
  "commission_pkr",
  "renewal_link",
  "portal_link",
];

function AdminWhatsAppConsole() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("custom_tour_submitted");
  const [recipientFilter, setRecipientFilter] = useState<"All" | "Traveler" | "Vendor" | "Admin">("All");
  const [templateBody, setTemplateBody] = useState<string>("");
  const [templateRecipient, setTemplateRecipient] = useState<string>("Traveler");
  const [templateImageUrl, setTemplateImageUrl] = useState<string>("");
  const [dbError, setDbError] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Hidden File Inputs for Local Image Uploads
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const testFileInputRef = useRef<HTMLInputElement>(null);

  // Test Message Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("+923490386131");
  const [testMessage, setTestMessage] = useState(
    "Hello from GlobeTrek PK Admin! 🌴\n\nThis is a test notification message verifying live WhatsApp API delivery and image media attachments. ✨"
  );
  const [testImageUrl, setTestImageUrl] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // API Key State
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("WHATSAPP_API_KEY");
      if (stored && stored.length > 20) {
        return stored;
      }
    }
    return "10e916da76bac02be1ac10635b9a04735450d8e2";
  });

  const saveCustomApiKey = (newKey: string) => {
    setApiKeyInput(newKey);
    if (typeof window !== "undefined") {
      localStorage.setItem("WHATSAPP_API_KEY", newKey);
    }
    toast.success("WhatsApp API Key updated locally.");
  };

  // Device ID State for WhatsClient Media Routing
  const [deviceIdInput, setDeviceIdInput] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("WHATSAPP_DEVICE_ID") || "";
    }
    return "";
  });

  const saveDeviceId = (newId: string) => {
    setDeviceIdInput(newId);
    if (typeof window !== "undefined") {
      localStorage.setItem("WHATSAPP_DEVICE_ID", newId);
    }
    toast.success("Device ID updated.");
  };

  // Connection query
  const connection = useQuery({
    queryKey: ["whatsapp-connection", apiKeyInput],
    queryFn: async () => {
      return await getWhatsAppConnection({ data: { apiKey: apiKeyInput.trim() || undefined } });
    },
  });

  // Dialog State for Creating New Template
  const [createOpen, setCreateOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>(["customer_name", "destination"]);
  const [newRecipient, setNewRecipient] = useState("Traveler");
  const [newBody, setNewBody] = useState("");

  // Helper for localStorage template fallback when DB table does not exist yet
  const getLocalTemplates = (): Record<string, Template> => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("LOCAL_WHATSAPP_TEMPLATES");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveLocalTemplate = (tpl: Template) => {
    if (typeof window === "undefined") return;
    try {
      const existing = getLocalTemplates();
      existing[tpl.id] = tpl;
      localStorage.setItem("LOCAL_WHATSAPP_TEMPLATES", JSON.stringify(existing));
    } catch (e) {
      console.warn("Failed to write to localStorage:", e);
    }
  };

  // Fetch templates from database or local fallback
  const { data: dbTemplates, isLoading } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const localMap = getLocalTemplates();
      try {
        const { data, error } = await supabase
          .from("whatsapp_templates")
          .select("*")
          .order("name");

        if (error) {
          if (error.message?.includes("does not exist")) setDbError(true);
          throw error;
        }
        setDbError(false);
        const existingMap = new Map(((data as Template[]) ?? []).map((t) => [t.id, t]));
        const merged: Template[] = [...((data as Template[]) ?? [])];

        for (const [id, info] of Object.entries(DEFAULT_GLOBETREK_TEMPLATES)) {
          if (!existingMap.has(id)) {
            merged.push(
              localMap[id] || {
                id,
                name: info.name,
                description: info.desc,
                body: info.body,
                recipient: info.recipient,
                image_url: info.image_url,
                variables: info.vars,
                updated_at: new Date().toISOString(),
              }
            );
          }
        }

        // Also merge any local custom templates
        for (const [id, localTpl] of Object.entries(localMap)) {
          if (!existingMap.has(id) && !DEFAULT_GLOBETREK_TEMPLATES[id]) {
            merged.push(localTpl);
          }
        }

        return merged;
      } catch (err) {
        console.warn("Using local/fallback templates due to missing table.", err);
        setDbError(true);

        const fallbackList: Template[] = Object.entries(DEFAULT_GLOBETREK_TEMPLATES).map(([id, info]) => (
          localMap[id] || {
            id,
            name: info.name,
            description: info.desc,
            body: info.body,
            recipient: info.recipient,
            image_url: info.image_url,
            variables: info.vars,
            updated_at: new Date().toISOString(),
          }
        ));

        for (const [id, localTpl] of Object.entries(localMap)) {
          if (!DEFAULT_GLOBETREK_TEMPLATES[id] && !fallbackList.some(t => t.id === id)) {
            fallbackList.push(localTpl);
          }
        }

        return fallbackList;
      }
    },
  });

  const selectedTemplate = dbTemplates?.find((t) => t.id === selectedId);

  // Set inputs when selection changes
  useEffect(() => {
    if (selectedTemplate) {
      setTemplateBody(selectedTemplate.body);
      setTemplateRecipient(selectedTemplate.recipient ?? "Traveler");
      setTemplateImageUrl(selectedTemplate.image_url ?? "");
    }
  }, [selectedTemplate]);

  // Save template mutation
  const saveTemplate = useMutation({
    mutationFn: async ({ id, body, recipient, imageUrl }: { id: string; body: string; recipient: string; imageUrl: string }) => {
      const defaultInfo = DEFAULT_GLOBETREK_TEMPLATES[id];
      const payload: Template = {
        id,
        name: selectedTemplate?.name || defaultInfo?.name || id,
        description: selectedTemplate?.description || defaultInfo?.desc || null,
        body,
        recipient,
        image_url: imageUrl.trim() || null,
        variables: selectedTemplate?.variables || defaultInfo?.vars || [],
        updated_at: new Date().toISOString(),
      };

      if (dbError) {
        saveLocalTemplate(payload);
        return;
      }

      const { error } = await supabase
        .from("whatsapp_templates")
        .upsert(payload);

      if (error) {
        saveLocalTemplate(payload);
      }
    },
    onSuccess: () => {
      toast.success("WhatsApp Template saved successfully!");
      qc.invalidateQueries({ queryKey: ["whatsapp-templates"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save template");
    },
  });

  // Reset template mutation
  const resetTemplate = useMutation({
    mutationFn: async (id: string) => {
      const defaultInfo = DEFAULT_GLOBETREK_TEMPLATES[id];
      if (!defaultInfo) throw new Error("No default preset for this template.");

      if (!dbError) {
        await supabase
          .from("whatsapp_templates")
          .delete()
          .eq("id", id);
      }
      setTemplateBody(defaultInfo.body);
      setTemplateRecipient(defaultInfo.recipient);
      setTemplateImageUrl(defaultInfo.image_url || "");
    },
    onSuccess: () => {
      toast.success("Template reset to original GlobeTrek default.");
      qc.invalidateQueries({ queryKey: ["whatsapp-templates"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reset template");
    },
  });

  // Create new template mutation
  const createTemplate = useMutation({
    mutationFn: async () => {
      if (!newId || !newName || !newBody) {
        throw new Error("ID, Name, and Message Body are required.");
      }

      if (dbError) {
        throw new Error("Cannot create: Database table 'whatsapp_templates' is missing.");
      }

      const slugId = newId.toLowerCase().replace(/[^a-z0-9_]/g, "_");

      const payload = {
        id: slugId,
        name: newName,
        description: newDesc || null,
        body: newBody,
        recipient: newRecipient,
        image_url: newImageUrl.trim() || null,
        variables: selectedChips,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("whatsapp_templates")
        .insert(payload);

      if (error) throw error;
      return slugId;
    },
    onSuccess: (createdId) => {
      toast.success("New template created!");
      setCreateOpen(false);
      setSelectedId(createdId);
      setNewId("");
      setNewName("");
      setNewDesc("");
      setNewImageUrl("");
      setNewBody("");
      qc.invalidateQueries({ queryKey: ["whatsapp-templates"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create template");
    },
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      if (DEFAULT_GLOBETREK_TEMPLATES[id]) {
        throw new Error("System default templates cannot be deleted.");
      }
      const { error } = await supabase.from("whatsapp_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template deleted.");
      setSelectedId("custom_tour_submitted");
      qc.invalidateQueries({ queryKey: ["whatsapp-templates"] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Helper for uploading local image to Supabase Storage bucket 'public-assets' or returning data URL
  const handleLocalImageUpload = async (file: File, target: "edit" | "new" | "test") => {
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `whatsapp-media/media-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("public-assets")
        .upload(filePath, file, { upsert: true });

      if (error) {
        // Fallback to data URL if storage bucket fails
        const reader = new FileReader();
        reader.onload = (e) => {
          const res = e.target?.result as string;
          if (target === "edit") setTemplateImageUrl(res);
          if (target === "new") setNewImageUrl(res);
          if (target === "test") setTestImageUrl(res);
          toast.info("Image loaded as local data preview.");
        };
        reader.readAsDataURL(file);
      } else {
        const { data: pub } = supabase.storage.from("public-assets").getPublicUrl(filePath);
        if (target === "edit") setTemplateImageUrl(pub.publicUrl);
        if (target === "new") setNewImageUrl(pub.publicUrl);
        if (target === "test") setTestImageUrl(pub.publicUrl);
        toast.success("Media image uploaded successfully!");
      }
    } catch (err: any) {
      toast.error("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Helper to insert dynamic tag variable into template body at cursor position
  const insertVariableChip = (variableName: string, isNewModal = false) => {
    const tag = `{${variableName}}`;
    if (isNewModal) {
      setNewBody((prev) => prev + " " + tag);
    } else {
      setTemplateBody((prev) => prev + " " + tag);
    }
    toast.info(`Inserted ${tag}`);
  };

  // Helper to send test message via modal
  const handleSendTestMessage = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.error("Phone number and message text are required.");
      return;
    }
    setSendingTest(true);
    try {
      const res = await sendWhatsAppMessage({
        data: {
          phone: testPhone.trim(),
          message: testMessage.trim(),
          imageUrl: testImageUrl.trim() || undefined,
          apiKey: apiKeyInput.trim() || undefined,
          deviceId: deviceIdInput.trim() || undefined,
          skipDeduplication: true,
        },
      });

      if (res.success) {
        toast.success(`WhatsApp message sent to ${testPhone}!`);
        setTestModalOpen(false);
      } else {
        toast.error(res.error || "Failed to dispatch WhatsApp message.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send test message.");
    } finally {
      setSendingTest(false);
    }
  };

  const filteredTemplates = dbTemplates?.filter((t) => {
    if (recipientFilter === "All") return true;
    return t.recipient === recipientFilter;
  }) || [];

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Top Header Bar with Live Gateway Badge & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-glow">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                WhatsApp Console &amp; System Templates
              </h1>
              <p className="text-xs text-muted-foreground">
                Customize automated notifications, customer alerts, and marketing templates sent via WhatsApp API.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs shadow-sm">
            {connection.isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Checking Gateway...</span>
              </>
            ) : connection.data?.connected ? (
              <>
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="font-bold text-emerald-400">Gateway: {connection.data.number || "+92 329 3089377"}</span>
              </>
            ) : (
              <>
                <WifiOff className="size-3.5 text-rose-400" />
                <span className="font-bold text-rose-400">Offline / Key Invalid</span>
              </>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              toast.info("Testing connection to wa.yello.bid...");
              const res = await connection.refetch();
              if (res.data?.connected) {
                toast.success(`WhatsApp Gateway Connected! ✓ (Device: ${res.data.number || "+92 329 3089377"})`);
              } else {
                toast.error(res.data?.message || "Gateway Connection Failed. Please check API Key.");
              }
            }}
            disabled={connection.isFetching}
            className="gap-1.5 text-xs font-bold rounded-xl border-border hover:bg-accent"
          >
            <RefreshCw className={`size-3.5 ${connection.isFetching ? "animate-spin" : ""}`} /> Test Connection
          </Button>

          <Button
            size="sm"
            onClick={() => setTestModalOpen(true)}
            className="gap-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl shadow-glow"
          >
            <Send className="size-3.5" /> Send Test Message
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          >
            <Plus className="size-3.5" /> Create Template
          </Button>
        </div>
      </div>

      {/* Gateway API Key & Device Configuration Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Key className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">WhatsApp Gateway Configuration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                  wa.yello.bid
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your API key and device routing ID to send automated WhatsApp notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-end">
          <div className="md:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>WhatsApp API Secret Key</span>
                <span className="text-rose-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? (
                  <>
                    <EyeOff className="size-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter WhatsApp Gateway API Key (e.g. 10e916...)"
                className="text-xs font-mono rounded-xl bg-background border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Device ID / Sender Number</span>
              <span className="text-[11px] text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              value={deviceIdInput}
              onChange={(e) => setDeviceIdInput(e.target.value)}
              placeholder="e.g. 03293089377"
              className="text-xs font-mono rounded-xl bg-background border-border"
            />
          </div>

          <div className="md:col-span-2">
            <Button
              size="default"
              onClick={() => {
                saveCustomApiKey(apiKeyInput);
                saveDeviceId(deviceIdInput);
                connection.refetch();
              }}
              className="w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl gap-1.5 shadow-sm h-9"
            >
              <Save className="size-3.5" />
              Save Key
            </Button>
          </div>
        </div>
      </div>

      {dbError && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-amber-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Database Table Notice — Temporary Local Fallback Active</p>
              <p className="text-amber-300/80 mt-0.5 leading-relaxed">
                Table <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200 font-mono">whatsapp_templates</code> was not found in Supabase. Your edits are saved locally. To persist templates permanently across all devices in Supabase, run the SQL script in your Supabase SQL Editor.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const sql = `CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  body TEXT NOT NULL,
  recipient TEXT NOT NULL DEFAULT 'Traveler',
  image_url TEXT,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read whatsapp_templates" ON public.whatsapp_templates;
CREATE POLICY "Public read whatsapp_templates" ON public.whatsapp_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage whatsapp_templates" ON public.whatsapp_templates;
CREATE POLICY "Admins manage whatsapp_templates" ON public.whatsapp_templates FOR ALL USING (true) WITH CHECK (true);`;
              navigator.clipboard.writeText(sql);
              toast.success("SQL Migration Script copied to clipboard! Paste into Supabase SQL Editor.");
              window.open("https://supabase.com/dashboard/project/rcldabxkcwfemnigwutk/sql/new", "_blank");
            }}
            className="text-xs font-bold rounded-xl border-amber-500/40 text-amber-300 hover:bg-amber-500/20 shrink-0 gap-1.5"
          >
            📋 Copy SQL Migration Script
          </Button>
        </div>
      )}

      {/* Main Dual-Panel Workspace: Left List, Right Rich Editor */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Template Selector List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Event Templates ({filteredTemplates.length})
            </h2>
            <span className="text-[11px] text-muted-foreground">Select to customize</span>
          </div>

          <div className="flex gap-1.5 p-1 bg-surface border border-border rounded-xl">
            {(["All", "Traveler", "Vendor", "Admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRecipientFilter(r)}
                className={`flex-1 py-1 px-2.5 text-[11px] font-bold rounded-lg transition-all ${
                  recipientFilter === r
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" /> Loading templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No templates found for filter: <span className="font-semibold">{recipientFilter}</span>.
              </div>
            ) : (
              filteredTemplates.map((t) => {
                const isSelected = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 space-y-2 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border/80 bg-card hover:border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                        <MessageSquare className={`size-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        {t.name}
                      </h3>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          t.recipient === "Admin"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : t.recipient === "Vendor"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : t.recipient === "Sales Partner"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {t.recipient || "Traveler"}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.description || t.body.slice(0, 90) + "..."}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Template Editor Workspace */}
        <div className="lg:col-span-7">
          {selectedTemplate ? (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-foreground">{selectedTemplate.name}</h2>
                    <span className="text-[10px] font-mono bg-surface px-2 py-0.5 rounded border border-border text-muted-foreground">
                      ID: {selectedTemplate.id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedTemplate.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!DEFAULT_GLOBETREK_TEMPLATES[selectedTemplate.id] && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTemplate.mutate(selectedTemplate.id)}
                      disabled={deleteTemplate.isPending}
                      className="gap-1 text-xs font-bold rounded-xl"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  )}
                  {DEFAULT_GLOBETREK_TEMPLATES[selectedTemplate.id] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetTemplate.mutate(selectedTemplate.id)}
                      disabled={resetTemplate.isPending}
                      className="gap-1 text-xs font-bold rounded-xl border-border"
                    >
                      <RotateCcw className="size-3.5" /> Reset Default
                    </Button>
                  )}
                </div>
              </div>

              {/* Recipient Audience & Media Image URL */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Recipient Audience</Label>
                  <Select value={templateRecipient} onValueChange={setTemplateRecipient}>
                    <SelectTrigger className="text-xs rounded-xl bg-background border-border">
                      <SelectValue placeholder="Select Recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Traveler">Traveler / Guest</SelectItem>
                      <SelectItem value="Vendor">Travel Agency / Vendor</SelectItem>
                      <SelectItem value="Admin">System Administrator</SelectItem>
                      <SelectItem value="Sales Partner">Sales Partner / Affiliate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Media Image URL (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={templateImageUrl}
                      onChange={(e) => setTemplateImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="text-xs rounded-xl bg-background border-border"
                    />
                    <input
                      type="file"
                      ref={editFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLocalImageUpload(file, "edit");
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={uploading}
                      className="gap-1 text-xs font-semibold rounded-xl border-border shrink-0"
                    >
                      {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      Upload
                    </Button>
                  </div>
                </div>
              </div>

              {/* Message Body Editor */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Template Message Body</span>
                  <span className="text-[11px] font-normal text-muted-foreground">WhatsApp formatting supported (*bold*, _italic_)</span>
                </Label>
                <Textarea
                  rows={10}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="font-mono text-xs leading-relaxed rounded-xl bg-background border-border"
                />
              </div>

              {/* Dynamic Variable Chips with Used vs Unused Highlight */}
              {(() => {
                const usedVariables = new Set(
                  (templateBody.match(/\{([a-zA-Z0-9_]+)\}/g) || []).map((v) => v.slice(1, -1))
                );
                return (
                  <div className="space-y-3 rounded-2xl border border-border/80 bg-surface/50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Info className="size-3.5 text-primary" /> Dynamic Variables Palette
                        </span>
                        {usedVariables.size > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {usedVariables.size} Active Tags
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-cyan-300 font-bold">
                          <span className="size-2 rounded-full bg-cyan-400 shadow-glow" /> Used in Message
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <span className="size-2 rounded-full bg-muted-foreground/40" /> Available to Click
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_VARIABLES.map((v) => {
                        const isIncluded = usedVariables.has(v);
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariableChip(v)}
                            className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                              isIncluded
                                ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-glow font-extrabold"
                                : "bg-primary/10 text-muted-foreground hover:text-primary border border-primary/20 hover:bg-primary/20 font-medium"
                            }`}
                          >
                            {isIncluded && <Check className="size-3 text-cyan-300 shrink-0" />}
                            {`{${v}}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() =>
                    saveTemplate.mutate({
                      id: selectedTemplate.id,
                      body: templateBody,
                      recipient: templateRecipient,
                      imageUrl: templateImageUrl,
                    })
                  }
                  disabled={saveTemplate.isPending}
                  className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6"
                >
                  {saveTemplate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save Template Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-muted-foreground rounded-2xl border border-dashed border-border/80 p-8">
              Select a template from the left list to customize.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Send Live Test WhatsApp Message */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-black text-lg">
              <Send className="size-5 text-emerald-400" /> Send Test WhatsApp Message
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Test live WhatsApp message delivery directly from the server to any mobile phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Recipient Mobile Phone Number</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+923490386131"
                className="text-xs font-mono rounded-xl bg-background border-border"
              />
              <span className="text-[10px] text-muted-foreground">Includes country code (e.g. +923490386131 or 03490386131)</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Test Message Body</Label>
              <Textarea
                rows={4}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="text-xs font-mono rounded-xl bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Media Image Attachment (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={testImageUrl}
                  onChange={(e) => setTestImageUrl(e.target.value)}
                  placeholder="https://... or upload local image"
                  className="text-xs rounded-xl bg-background border-border"
                />
                <input
                  type="file"
                  ref={testFileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLocalImageUpload(file, "test");
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => testFileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-1 text-xs font-semibold rounded-xl border-border shrink-0"
                >
                  {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                  Upload local
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setTestModalOpen(false)} className="rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendTestMessage}
              disabled={sendingTest}
              className="gap-2 font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl"
            >
              {sendingTest ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send Test Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Create New Custom Template */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-foreground text-lg">Create New WhatsApp Template</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new automated notification template for custom system events.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Template ID (Slug)</Label>
                <Input
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. visa_status_updated"
                  className="text-xs font-mono rounded-xl bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Template Display Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Visa Status Updated (Guest)"
                  className="text-xs rounded-xl bg-background border-border"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Recipient Audience</Label>
                <Select value={newRecipient} onValueChange={setNewRecipient}>
                  <SelectTrigger className="text-xs rounded-xl bg-background border-border">
                    <SelectValue placeholder="Select Recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Traveler">Traveler / Guest</SelectItem>
                    <SelectItem value="Vendor">Travel Agency / Vendor</SelectItem>
                    <SelectItem value="Admin">System Administrator</SelectItem>
                    <SelectItem value="Sales Partner">Sales Partner / Affiliate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Description</Label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Sent when visa application status changes."
                  className="text-xs rounded-xl bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Media Image URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs rounded-xl bg-background border-border"
                />
                <input
                  type="file"
                  ref={newFileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLocalImageUpload(file, "new");
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => newFileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-1 text-xs font-semibold rounded-xl border-border shrink-0"
                >
                  {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                  Upload
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Template Message Body</Label>
              <Textarea
                rows={5}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Dear {customer_name}, your visa update..."
                className="text-xs font-mono rounded-xl bg-background border-border"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createTemplate.mutate()}
              disabled={createTemplate.isPending}
              className="gap-2 font-bold text-xs bg-primary text-primary-foreground rounded-xl"
            >
              {createTemplate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

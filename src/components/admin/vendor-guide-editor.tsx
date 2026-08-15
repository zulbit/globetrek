import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVendorGuideSections,
  createVendorGuideSection,
  updateVendorGuideSection,
  deleteVendorGuideSection,
  VendorGuideSection,
  FALLBACK_VENDOR_GUIDE_SECTIONS,
} from "@/lib/vendor-guide.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  BookOpen,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Check,
  Compass,
  UserCheck,
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const PRESET_SCREENSHOTS = [
  {
    title: "Auth & Partner Registration Screen",
    url: "/images/guide/auth-page.png",
    description: "Partner sign-up and KYC verification portal",
  },
  {
    title: "Main Marketplace Landing Page",
    url: "/images/guide/landing-page.png",
    description: "Homepage hero, search, and quality standards",
  },
  {
    title: "Vendor Operations Console Overview",
    url: "/images/guide/vendor-dashboard.png",
    description: "Vendor analytics, 30-day line chart, and stats",
  },
  {
    title: "Custom Lead Marketplace & Bidding",
    url: "/images/guide/vendor-leads-marketplace.png",
    description: "Verified tour request bidding and quotation dialog",
  },
  {
    title: "Enterprise Architecture & Whitepaper",
    url: "/images/whitepaper/enterprise-page.png",
    description: "Enterprise stack breakdown and feature comparison",
  },
];

export function AdminVendorGuideEditor() {
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<Partial<VendorGuideSection> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Fetch sections
  const { data: sections = FALLBACK_VENDOR_GUIDE_SECTIONS, isLoading } = useQuery({
    queryKey: ["vendor-guide-sections"],
    queryFn: () => fetchVendorGuideSections(),
    initialData: FALLBACK_VENDOR_GUIDE_SECTIONS,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<VendorGuideSection>) => {
      if (payload.id) {
        return await updateVendorGuideSection({ data: { id: payload.id, payload } });
      } else {
        return await createVendorGuideSection({
          data: {
            slug: payload.slug || `section-${Date.now()}`,
            title: payload.title || "New Section",
            category: payload.category || "General",
            description: payload.description || "",
            content: payload.content || "",
            icon_name: payload.icon_name || "BookOpen",
            display_order: payload.display_order || sections.length + 1,
            is_published: payload.is_published ?? true,
          },
        });
      }
    },
    onSuccess: () => {
      toast.success("Vendor Guide section saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendor-guide-sections"] });
      setIsDialogOpen(false);
      setEditingSection(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to save section: ${err.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteVendorGuideSection({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Section deleted!");
      queryClient.invalidateQueries({ queryKey: ["vendor-guide-sections"] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete: ${err.message}`);
    },
  });

  const handleCreateNew = () => {
    setEditingSection({
      title: "",
      slug: "",
      category: "Onboarding & Setup",
      description: "",
      content: "",
      icon_name: "BookOpen",
      display_order: sections.length + 1,
      is_published: true,
    });
    setActiveTab("edit");
    setIsDialogOpen(true);
  };

  const handleEdit = (sec: VendorGuideSection) => {
    setEditingSection({ ...sec });
    setActiveTab("edit");
    setIsDialogOpen(true);
  };

  // Extract primary/main screenshot from markdown content
  const extractMainScreenshot = (content: string = "") => {
    const match = content.match(/!\[(.*?)\]\((.*?)\)/);
    if (match) {
      return { alt: match[1], url: match[2], fullMatch: match[0] };
    }
    return null;
  };

  // Replace or set the main screenshot at the top of the chapter
  const replaceMainScreenshot = (title: string, url: string) => {
    if (!editingSection) return;
    const currentContent = editingSection.content || "";
    const mainImg = extractMainScreenshot(currentContent);
    const newTag = `![${title}](${url})`;

    let newContent = "";
    if (mainImg) {
      // Replace existing primary image
      newContent = currentContent.replace(mainImg.fullMatch, newTag);
    } else {
      // Insert right after the top header (or at the very top)
      const headerMatch = currentContent.match(/^(# [^\n]+\n+)/);
      if (headerMatch) {
        newContent = currentContent.replace(headerMatch[0], `${headerMatch[0]}${newTag}\n\n`);
      } else {
        newContent = `${newTag}\n\n${currentContent}`;
      }
    }

    setEditingSection((prev) => ({
      ...prev,
      content: newContent,
    }));
    toast.success(`Main screenshot replaced with "${title}"!`);
  };

  // Remove main screenshot from chapter
  const removeMainScreenshot = () => {
    if (!editingSection) return;
    const currentContent = editingSection.content || "";
    const mainImg = extractMainScreenshot(currentContent);
    if (!mainImg) return;
    const newContent = currentContent.replace(mainImg.fullMatch, "").replace(/\n\s*\n\s*\n/g, "\n\n");
    setEditingSection((prev) => ({ ...prev, content: newContent }));
    toast.success("Main screenshot removed from chapter.");
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleLocalScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const toastId = toast.loading(`Uploading "${file.name}"...`);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    try {
      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `guide-screenshots/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

      const { data, error } = await supabase.storage
        .from("public-assets")
        .upload(filePath, file, { upsert: true });

      if (error) {
        // Fallback: Read as Base64 Data URL so upload always succeeds even if storage bucket isn't initialized
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          replaceMainScreenshot(cleanTitle, dataUrl);
          toast.success(`Main screenshot updated as preview!`, { id: toastId });
        };
        reader.readAsDataURL(file);
      } else {
        const { data: pub } = supabase.storage.from("public-assets").getPublicUrl(filePath);
        replaceMainScreenshot(cleanTitle, pub.publicUrl);
        toast.success(`Main screenshot uploaded and replaced!`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: toastId });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="size-5 text-primary" /> Vendor Operating Guide &amp; CMS Panel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage documentation chapters, quality standards, and screenshot imagery for the public `/vendor-guide`.
          </p>
        </div>

        <Button onClick={handleCreateNew} size="sm" className="gap-1.5 font-semibold">
          <Plus className="size-4" /> Add Guide Chapter
        </Button>
      </div>

      {/* Content Table / Card List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading guide chapters...
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-card">
          No vendor guide sections found. Click "Add Guide Chapter" to create one.
        </div>
      ) : (
        <div className="grid gap-4">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-border-hover"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                    {sec.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">Order: #{sec.display_order}</span>
                  <Badge
                    className={
                      sec.is_published
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]"
                        : "bg-muted text-muted-foreground text-[10px]"
                    }
                  >
                    {sec.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>

                <h3 className="font-bold text-base text-foreground">{sec.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{sec.description}</p>
                <span className="text-[10px] text-muted-foreground font-mono">slug: /{sec.slug}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => handleEdit(sec)}
                >
                  <Edit className="size-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${sec.title}"?`)) {
                      deleteMutation.mutate(sec.id);
                    }
                  }}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <BookOpen className="size-5 text-primary" />
              {editingSection?.id ? "Edit Guide Chapter" : "Create Guide Chapter"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Edit chapter metadata, category, icon, and Markdown documentation text.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="edit" className="text-xs gap-1.5">
                <Edit className="size-3.5" /> Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs gap-1.5">
                <Eye className="size-3.5" /> Live Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Chapter Title</label>
                  <Input
                    placeholder="e.g. Vendor Registration & KYC"
                    value={editingSection?.title || ""}
                    onChange={(e) =>
                      setEditingSection((prev) => ({
                        ...prev,
                        title: e.target.value,
                        slug: prev?.slug || e.target.value.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"),
                      }))
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">URL Slug</label>
                  <Input
                    placeholder="e.g. vendor-registration-and-kyc"
                    value={editingSection?.slug || ""}
                    onChange={(e) => setEditingSection((prev) => ({ ...prev, slug: e.target.value }))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Category</label>
                  <Input
                    placeholder="e.g. Onboarding & Setup"
                    value={editingSection?.category || ""}
                    onChange={(e) => setEditingSection((prev) => ({ ...prev, category: e.target.value }))}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Icon Name</label>
                  <Input
                    placeholder="e.g. UserCheck, Compass, LayoutDashboard"
                    value={editingSection?.icon_name || "BookOpen"}
                    onChange={(e) => setEditingSection((prev) => ({ ...prev, icon_name: e.target.value }))}
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Display Order</label>
                  <Input
                    type="number"
                    value={editingSection?.display_order || 1}
                    onChange={(e) => setEditingSection((prev) => ({ ...prev, display_order: parseInt(e.target.value, 10) || 1 }))}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Short Summary / Description</label>
                <Input
                  placeholder="A concise summary displayed under chapter headers..."
                  value={editingSection?.description || ""}
                  onChange={(e) => setEditingSection((prev) => ({ ...prev, description: e.target.value }))}
                  className="text-xs"
                />
              </div>

              {/* Main Chapter Screenshot Manager (Replaces the top primary screenshot) */}
              {(() => {
                const mainImg = extractMainScreenshot(editingSection?.content);
                return (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="size-4 text-primary" />
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Main Chapter Screenshot</h4>
                          <p className="text-[11px] text-muted-foreground">
                            The primary screenshot displayed at the top of this chapter.
                          </p>
                        </div>
                      </div>
                      {mainImg && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeMainScreenshot}
                          className="h-6 text-[11px] text-destructive hover:bg-destructive/10 px-2"
                        >
                          <Trash2 className="size-3 mr-1" /> Remove Image
                        </Button>
                      )}
                    </div>

                    {/* Hidden file picker input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLocalScreenshotUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Screenshot Preview Card */}
                    {mainImg ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-card border border-border p-3 rounded-xl shadow-xs">
                        <img
                          src={mainImg.url}
                          alt={mainImg.alt || "Main Chapter Screenshot"}
                          className="w-full sm:w-48 h-28 object-cover rounded-lg border border-border bg-surface"
                        />
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{mainImg.alt || "Chapter Screenshot"}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate max-w-full">{mainImg.url}</p>
                          <div className="pt-1.5 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isUploadingImage}
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs h-7 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-xs"
                            >
                              {isUploadingImage ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                              Upload & Replace Screenshot
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-card border border-dashed border-border p-3 rounded-xl">
                        <span className="text-xs text-muted-foreground">No main screenshot set for this chapter.</span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isUploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs h-7 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-xs"
                        >
                          {isUploadingImage ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                          Upload Main Screenshot
                        </Button>
                      </div>
                    )}

                    {/* Quick Preset Selector to Replace Main Screenshot */}
                    <div className="pt-1 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Or Pick from System Presets to Replace:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_SCREENSHOTS.map((ps) => (
                          <Button
                            key={ps.url}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-6 gap-1 border-border/80 hover:bg-surface text-muted-foreground hover:text-foreground"
                            onClick={() => replaceMainScreenshot(ps.title, ps.url)}
                          >
                            <Plus className="size-2.5" /> {ps.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Markdown Editor Textarea */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Markdown Documentation Body</label>
                <Textarea
                  placeholder="# Chapter Header&#10;&#10;Write detailed documentation using Markdown..."
                  rows={12}
                  value={editingSection?.content || ""}
                  onChange={(e) => setEditingSection((prev) => ({ ...prev, content: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingSection?.is_published ?? true}
                    onCheckedChange={(c) => setEditingSection((prev) => ({ ...prev, is_published: c }))}
                  />
                  <span className="text-xs font-semibold">Publish on Public Guide (`/vendor-guide`)</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                <div className="border-b border-border pb-3">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold mb-1">
                    {editingSection?.category || "Category"}
                  </Badge>
                  <h2 className="text-xl font-bold text-foreground">{editingSection?.title || "Untitled Chapter"}</h2>
                  <p className="text-xs text-muted-foreground">{editingSection?.description}</p>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                  <ReactMarkdown>{editingSection?.content || "*No content written yet...*"}</ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5 font-bold"
              disabled={saveMutation.isPending || !editingSection?.title}
              onClick={() => saveMutation.mutate(editingSection!)}
            >
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

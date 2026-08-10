import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = "https://globetrek.pk";

        let tours: Array<{ id: string; updated_at?: string | null }> = [];
        try {
          const { data, error } = await supabaseAdmin
            .from("tours")
            .select("id, updated_at")
            .eq("is_active", true);

          if (!error && data) {
            tours = data;
          }
        } catch (err) {
          console.warn("[api/sitemap.xml] Error querying active tours:", err);
        }

        const today = new Date().toISOString().split("T")[0];

        const staticRoutes = [
          { path: "", priority: "1.0", changefreq: "daily" },
          { path: "/tours", priority: "0.9", changefreq: "daily" },
          { path: "/custom-tour", priority: "0.9", changefreq: "weekly" },
          { path: "/visa", priority: "0.9", changefreq: "weekly" },
          { path: "/insurance", priority: "0.8", changefreq: "weekly" },
          { path: "/tickets", priority: "0.8", changefreq: "daily" },
          { path: "/pricing", priority: "0.7", changefreq: "monthly" },
          { path: "/vendor-guide", priority: "0.6", changefreq: "monthly" },
          { path: "/become-affiliate", priority: "0.7", changefreq: "monthly" },
          { path: "/about", priority: "0.5", changefreq: "monthly" },
          { path: "/terms", priority: "0.3", changefreq: "yearly" },
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        staticRoutes.forEach(({ path, priority, changefreq }) => {
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}${path}</loc>\n`;
          xml += `    <lastmod>${today}</lastmod>\n`;
          xml += `    <changefreq>${changefreq}</changefreq>\n`;
          xml += `    <priority>${priority}</priority>\n`;
          xml += `  </url>\n`;
        });

        if (tours.length > 0) {
          tours.forEach((tour) => {
            const lastMod = tour.updated_at
              ? tour.updated_at.split("T")[0]
              : today;

            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}/tours/${tour.id}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.85</priority>\n`;
            xml += `  </url>\n`;
          });
        }

        xml += `</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});

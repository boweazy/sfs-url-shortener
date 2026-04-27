import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { CreateUrlCard } from "@/components/CreateUrlCard";
import { AnalyticsCards } from "@/components/AnalyticsCards";
import { UrlTable, type UrlItem } from "@/components/UrlTable";
import { UrlDetailPanel } from "@/components/UrlDetailPanel";
import { BulkImportModal } from "@/components/BulkImportModal";
import { ApiKeysPanel } from "@/components/ApiKeysPanel";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link2, Key, Settings2 } from "lucide-react";

interface AnalyticsSummary { totalUrls: number; totalClicks: number; clicksToday: number; }
interface UrlAnalytics { chartData: { date: string; clicks: number }[]; referrers: { source: string; clicks: number }[]; }

type Tab = "urls" | "keys" | "settings";

export default function Dashboard() {
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [tab, setTab] = useState<Tab>("urls");
  const { toast } = useToast();

  const { data: urls = [], isLoading: urlsLoading } = useQuery<UrlItem[]>({ queryKey: ["/api/urls"] });
  const { data: summary } = useQuery<AnalyticsSummary>({ queryKey: ["/api/analytics/summary"] });
  const { data: urlAnalytics } = useQuery<UrlAnalytics>({
    queryKey: ["/api/urls", selectedUrl?.id, "analytics"],
    enabled: !!selectedUrl?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: { destination: string; shortCode?: string; title?: string; password?: string; expiresAt?: string }) =>
      apiRequest("POST", "/api/urls", data),
    onSuccess: async (res) => {
      const newUrl = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      toast({ title: "URL created!", description: `/${newUrl.shortCode} is ready` });
    },
    onError: async (err: any) => {
      let msg = "Failed to create URL";
      try {
        const body = await err.json?.();
        if (body?.error?.shortCode) msg = body.error.shortCode[0];
        else if (body?.error?.destination) msg = body.error.destination[0];
      } catch {}
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/urls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      if (selectedUrl) setSelectedUrl(null);
      toast({ title: "Deleted", description: "URL has been removed" });
    },
  });

  const handleCreate = (data: { url: string; customSlug: string; generateQr: boolean; password?: string; expiresAt?: string; title?: string }) => {
    createMutation.mutate({
      destination: data.url,
      shortCode: data.customSlug || undefined,
      title: data.title || undefined,
      password: data.password || undefined,
      expiresAt: data.expiresAt || undefined,
    });
  };

  const tabBtn = (id: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(id)}
      data-testid={`tab-${id}`}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
      style={{
        background: tab === id ? "rgba(255,215,0,0.15)" : "transparent",
        color: tab === id ? "#FFD700" : "rgba(245,245,220,0.55)",
        border: tab === id ? "1px solid rgba(255,215,0,0.35)" : "1px solid transparent",
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-10">
        {selectedUrl ? (
          <UrlDetailPanel
            url={selectedUrl}
            clickHistory={urlAnalytics?.chartData ?? []}
            referrers={urlAnalytics?.referrers ?? []}
            onBack={() => setSelectedUrl(null)}
          />
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <AnalyticsCards
              totalUrls={summary?.totalUrls ?? 0}
              totalClicks={summary?.totalClicks ?? 0}
              clicksToday={summary?.clicksToday ?? 0}
            />

            {/* Tab bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {tabBtn("urls", "URLs", <Link2 className="h-4 w-4" />)}
              {tabBtn("keys", "API Keys", <Key className="h-4 w-4" />)}
              {tabBtn("settings", "Custom Domain", <Settings2 className="h-4 w-4" />)}
            </div>

            {/* URLs tab */}
            {tab === "urls" && (
              <div className="space-y-8">
                {/* Create form */}
                <CreateUrlCard onSubmit={handleCreate} isPending={createMutation.isPending} />

                {/* URL list header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-2xl font-bold gold-text">Your URLs</h2>
                  <button
                    onClick={() => setShowBulkImport(true)}
                    data-testid="button-bulk-import-open"
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all"
                    style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.25)", color: "#FFD700" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.16)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.08)"; }}
                  >
                    <Upload className="h-4 w-4" />
                    Bulk Import
                  </button>
                </div>

                {urlsLoading ? (
                  <div className="glass-card rounded-2xl p-8 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 rounded-xl animate-pulse"
                        style={{ background: "rgba(255,215,0,0.06)" }} />
                    ))}
                  </div>
                ) : urls.length === 0 ? (
                  <div className="glass-card rounded-2xl">
                    <EmptyState onCreateClick={() => document.getElementById("destination-url")?.focus()} />
                  </div>
                ) : (
                  <UrlTable
                    urls={urls}
                    onUrlClick={setSelectedUrl}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onViewQr={(url) => setSelectedUrl(url)}
                  />
                )}
              </div>
            )}

            {/* API Keys tab */}
            {tab === "keys" && <ApiKeysPanel />}

            {/* Custom Domain / Settings tab */}
            {tab === "settings" && <CustomDomainInfo />}
          </div>
        )}
      </main>

      {/* Bulk import modal */}
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} />}

      {/* Footer */}
      <footer className="mt-16 py-6 text-center text-xs" style={{ borderTop: "1px solid rgba(255,215,0,0.12)", color: "rgba(245,245,220,0.40)" }}>
        <span>&copy; 2025 SmartFlow Systems. </span>
        <span className="gold-text">AI-Powered Automation for Modern Businesses</span>
      </footer>
    </div>
  );
}

// ── Custom Domain Info ──────────────────────────────────────────────────────
function CustomDomainInfo() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="glass-card rounded-2xl p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold gold-text mb-2">Custom Domain Setup</h2>
          <p className="text-sm" style={{ color: "rgba(245,245,220,0.55)" }}>
            Point your own domain (e.g. <code className="text-yellow-400">go.yourcompany.com</code>) to this LinkShort instance.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Add a CNAME record",
              desc: "In your DNS provider, add a CNAME record pointing to your deployed LinkShort hostname.",
              code: `CNAME  go.yourcompany.com  →  your-app.replit.app`,
            },
            {
              step: "2",
              title: "Configure your host",
              desc: "If you are self-hosting, update your reverse proxy (Nginx / Caddy) to proxy the custom domain to this app on port 5000.",
              code: `server_name go.yourcompany.com;\nproxy_pass http://localhost:5000;`,
            },
            {
              step: "3",
              title: "Wait for DNS propagation",
              desc: "DNS changes can take up to 48 hours to propagate globally. Use a tool like dnschecker.org to verify.",
              code: null,
            },
            {
              step: "4",
              title: "Enable HTTPS",
              desc: "Use Let's Encrypt / Certbot to issue a free TLS certificate for your custom domain.",
              code: `certbot --nginx -d go.yourcompany.com`,
            },
          ].map(({ step, title, desc, code }) => (
            <div key={step} className="rounded-xl p-5 space-y-3"
              style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.14)" }}>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0"
                  style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.35)", color: "#FFD700" }}>
                  {step}
                </span>
                <h3 className="font-semibold" style={{ color: "#F5F5DC" }}>{title}</h3>
              </div>
              <p className="text-sm pl-10" style={{ color: "rgba(245,245,220,0.60)" }}>{desc}</p>
              {code && (
                <pre className="text-xs font-mono rounded-lg px-4 py-3 pl-10 ml-0 overflow-x-auto"
                  style={{ background: "rgba(0,0,0,0.35)", color: "#22c55e" }}>
                  {code}
                </pre>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4"
          style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.20)" }}>
          <p className="text-sm font-medium gold-text mb-1">Note</p>
          <p className="text-sm" style={{ color: "rgba(245,245,220,0.60)" }}>
            Custom domain DNS management is handled outside of LinkShort — this guide is informational. Contact your domain registrar or hosting provider for specific instructions.
          </p>
        </div>
      </div>
    </div>
  );
}

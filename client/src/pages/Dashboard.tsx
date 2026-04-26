import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { CreateUrlCard } from "@/components/CreateUrlCard";
import { AnalyticsCards } from "@/components/AnalyticsCards";
import { UrlTable, type UrlItem } from "@/components/UrlTable";
import { UrlDetailPanel } from "@/components/UrlDetailPanel";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsSummary { totalUrls: number; totalClicks: number; clicksToday: number; }
interface UrlAnalytics { chartData: { date: string; clicks: number }[]; referrers: { source: string; clicks: number }[]; }

export default function Dashboard() {
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);
  const { toast } = useToast();

  const { data: urls = [], isLoading: urlsLoading } = useQuery<UrlItem[]>({ queryKey: ["/api/urls"] });
  const { data: summary } = useQuery<AnalyticsSummary>({ queryKey: ["/api/analytics/summary"] });
  const { data: urlAnalytics } = useQuery<UrlAnalytics>({
    queryKey: ["/api/urls", selectedUrl?.id, "analytics"],
    enabled: !!selectedUrl?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: { destination: string; shortCode?: string }) =>
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

  const handleCreate = (data: { url: string; customSlug: string; generateQr: boolean }) => {
    createMutation.mutate({ destination: data.url, shortCode: data.customSlug || undefined });
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-10">
        {selectedUrl ? (
          <UrlDetailPanel
            shortCode={selectedUrl.shortCode}
            destination={selectedUrl.destination}
            created={selectedUrl.created}
            totalClicks={selectedUrl.clicks}
            clickHistory={urlAnalytics?.chartData ?? []}
            referrers={urlAnalytics?.referrers ?? []}
            onBack={() => setSelectedUrl(null)}
          />
        ) : (
          <div className="space-y-10">
            {/* Stats */}
            <AnalyticsCards
              totalUrls={summary?.totalUrls ?? 0}
              totalClicks={summary?.totalClicks ?? 0}
              clicksToday={summary?.clicksToday ?? 0}
            />

            {/* Create form */}
            <CreateUrlCard onSubmit={handleCreate} isPending={createMutation.isPending} />

            {/* URL list */}
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
              <div>
                <h2 className="text-2xl font-bold gold-text mb-6">Your URLs</h2>
                <UrlTable
                  urls={urls}
                  onUrlClick={setSelectedUrl}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onViewQr={(url) => setSelectedUrl(url)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 text-center text-xs" style={{ borderTop: "1px solid rgba(255,215,0,0.12)", color: "rgba(245,245,220,0.40)" }}>
        <span>&copy; 2025 SmartFlow Systems. </span>
        <span className="gold-text">AI-Powered Automation for Modern Businesses</span>
      </footer>
    </div>
  );
}

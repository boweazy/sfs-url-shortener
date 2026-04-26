import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { CreateUrlCard } from "@/components/CreateUrlCard";
import { AnalyticsCards } from "@/components/AnalyticsCards";
import { UrlTable, type UrlItem } from "@/components/UrlTable";
import { UrlDetailPanel } from "@/components/UrlDetailPanel";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsSummary {
  totalUrls: number;
  totalClicks: number;
  clicksToday: number;
}

interface UrlAnalytics {
  chartData: { date: string; clicks: number }[];
  referrers: { source: string; clicks: number }[];
}

export default function Dashboard() {
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);
  const { toast } = useToast();

  const { data: urls = [], isLoading: urlsLoading } = useQuery<UrlItem[]>({
    queryKey: ["/api/urls"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
  });

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
    createMutation.mutate({
      destination: data.url,
      shortCode: data.customSlug || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
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
          <div className="space-y-8">
            {summaryLoading ? (
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-8 w-24 mb-2" />
                      <Skeleton className="h-10 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <AnalyticsCards
                totalUrls={summary?.totalUrls ?? 0}
                totalClicks={summary?.totalClicks ?? 0}
                clicksToday={summary?.clicksToday ?? 0}
              />
            )}

            <CreateUrlCard
              onSubmit={handleCreate}
              isPending={createMutation.isPending}
            />

            {urlsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : urls.length === 0 ? (
              <Card>
                <EmptyState
                  onCreateClick={() => {
                    document
                      .getElementById("destination-url")
                      ?.focus();
                  }}
                />
              </Card>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Your URLs</h2>
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
    </div>
  );
}

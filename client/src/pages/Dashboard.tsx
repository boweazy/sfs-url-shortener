import { useState } from "react";
import { Header } from "@/components/Header";
import { CreateUrlCard } from "@/components/CreateUrlCard";
import { AnalyticsCards } from "@/components/AnalyticsCards";
import { UrlTable, type UrlItem } from "@/components/UrlTable";
import { UrlDetailPanel } from "@/components/UrlDetailPanel";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { useLinks, useDeleteLink } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);
  const { data: linksData, isLoading } = useLinks();
  const deleteLink = useDeleteLink();
  const { toast } = useToast();
  const urls = linksData || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteLink.mutateAsync(id);
      if (selectedUrl?.id === id) {
        setSelectedUrl(null);
      }
      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
  const clicksToday = 0; // Would need real-time tracking for this

  const mockClickHistory = [
    { date: "Nov 8", clicks: 12 },
    { date: "Nov 9", clicks: 18 },
    { date: "Nov 10", clicks: 25 },
    { date: "Nov 11", clicks: 31 },
    { date: "Nov 12", clicks: 28 },
    { date: "Nov 13", clicks: 42 },
    { date: "Nov 14", clicks: selectedUrl ? selectedUrl.clicks % 50 : 35 },
  ];

  const mockReferrers = [
    { source: "twitter.com", clicks: 89 },
    { source: "facebook.com", clicks: 56 },
    { source: "Direct", clicks: 42 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        {selectedUrl ? (
          <UrlDetailPanel
            linkId={selectedUrl.id}
            shortCode={selectedUrl.shortCode}
            destination={selectedUrl.destination}
            created={selectedUrl.created}
            totalClicks={selectedUrl.clicks}
            clickHistory={mockClickHistory}
            referrers={mockReferrers}
            onBack={() => setSelectedUrl(null)}
          />
        ) : (
          <div className="space-y-8">
            <AnalyticsCards
              totalUrls={urls.length}
              totalClicks={totalClicks}
              clicksToday={clicksToday}
            />

            <CreateUrlCard />

            {urls.length === 0 ? (
              <Card>
                <EmptyState onCreateClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
              </Card>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Your URLs</h2>
                <UrlTable
                  urls={urls}
                  onUrlClick={setSelectedUrl}
                  onDelete={handleDelete}
                  onViewQr={(url) => {
                    setSelectedUrl(url);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

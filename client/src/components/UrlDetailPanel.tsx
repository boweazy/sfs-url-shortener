import { ArrowLeft, Copy, ExternalLink, Lock, Clock } from "lucide-react";
import { QrCodeDisplay } from "./QrCodeDisplay";
import { ClickMap } from "./ClickMap";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { UrlItem } from "./UrlTable";

interface ClickData { date: string; clicks: number; }
interface ReferrerData { source: string; clicks: number; }

interface UrlDetailPanelProps {
  url: UrlItem;
  clickHistory?: ClickData[];
  referrers?: ReferrerData[];
  onBack: () => void;
}

export function UrlDetailPanel({
  url, clickHistory = [], referrers = [], onBack,
}: UrlDetailPanelProps) {
  const { toast } = useToast();
  const shortUrl = `${window.location.origin}/${url.shortCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    toast({ title: "Copied!", description: "Short URL copied to clipboard" });
  };

  const expired = !!url.expiresAt && new Date(url.expiresAt) < new Date();

  return (
    <div className="space-y-6 sfs-animate-fade-in">
      <button
        onClick={onBack}
        data-testid="button-back"
        className="flex items-center gap-2 text-sm font-medium rounded-full px-4 py-2 transition-all duration-150"
        style={{ color: "rgba(255,215,0,0.80)", border: "1px solid rgba(255,215,0,0.25)", background: "rgba(255,215,0,0.06)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.14)"; (e.currentTarget as HTMLElement).style.color = "#FFD700"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,215,0,0.80)"; }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all URLs
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* URL details */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold gold-text">
                  {url.title || `/${url.shortCode}`}
                </h2>
                {url.title && (
                  <p className="font-mono text-sm mt-0.5" style={{ color: "rgba(255,215,0,0.60)" }}>/{url.shortCode}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {url.hasPassword && (
                  <span className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1"
                    style={{ background: "rgba(255,215,0,0.10)", border: "1px solid rgba(255,215,0,0.25)", color: "#FFD700" }}>
                    <Lock className="h-3 w-3" /> Protected
                  </span>
                )}
                {expired ? (
                  <span className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1"
                    style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                    <Clock className="h-3 w-3" /> Expired
                  </span>
                ) : url.expiresAt ? (
                  <span className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1"
                    style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
                    <Clock className="h-3 w-3" /> Expires {new Date(url.expiresAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(245,245,220,0.50)" }}>Short URL</p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 font-mono text-sm rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.20)", color: "#FFD700" }}
                  data-testid="text-short-url"
                >
                  {shortUrl}
                </code>
                <button
                  onClick={handleCopy}
                  data-testid="button-copy-detail"
                  className="shrink-0 rounded-xl p-3 transition-all"
                  style={{ background: "rgba(255,215,0,0.10)", border: "1px solid rgba(255,215,0,0.25)", color: "#FFD700" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.20)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.10)"; }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(245,245,220,0.50)" }}>Destination</p>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm truncate" style={{ color: "rgba(245,245,220,0.80)" }}>{url.destination}</span>
                <a href={url.destination} target="_blank" rel="noopener noreferrer" data-testid="link-destination-detail">
                  <ExternalLink className="h-4 w-4 shrink-0" style={{ color: "rgba(245,245,220,0.40)" }} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)" }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "rgba(245,245,220,0.50)" }}>Total Clicks</p>
                <p className="text-3xl font-bold gold-text" data-testid="text-detail-clicks">{url.clicks}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)" }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "rgba(245,245,220,0.50)" }}>Created</p>
                <p className="text-sm font-medium" style={{ color: "#F5F5DC" }}>{url.created}</p>
              </div>
            </div>
          </div>

          {/* Analytics chart */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold gold-text mb-4">Click Analytics (Last 7 Days)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clickHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,215,0,0.10)" />
                  <XAxis dataKey="date" stroke="rgba(245,245,220,0.40)" fontSize={11} />
                  <YAxis stroke="rgba(245,245,220,0.40)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(59,47,47,0.95)",
                      border: "1px solid rgba(255,215,0,0.30)",
                      borderRadius: "10px",
                      color: "#F5F5DC",
                    }}
                  />
                  <Line type="monotone" dataKey="clicks" stroke="#FFD700" strokeWidth={2.5}
                    dot={{ fill: "#FFD700", r: 4 }} activeDot={{ r: 6, fill: "#FFD700", stroke: "rgba(255,215,0,0.40)", strokeWidth: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Click Map */}
          <ClickMap urlId={url.id} />

          {/* Referrers */}
          {referrers.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold gold-text mb-4">Top Referrers</h3>
              <div className="space-y-3">
                {referrers.map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "rgba(245,245,220,0.80)" }}>{ref.source}</span>
                    <span
                      className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                      style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.25)" }}
                    >
                      {ref.clicks} clicks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — QR */}
        <div>
          <QrCodeDisplay url={shortUrl} shortCode={url.shortCode} />
        </div>
      </div>
    </div>
  );
}

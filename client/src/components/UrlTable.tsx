import { useState } from "react";
import { Copy, ExternalLink, QrCode, Search, Trash2, Lock, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface UrlItem {
  id: string;
  shortCode: string;
  destination: string;
  title?: string | null;
  clicks: number;
  created: string;
  createdAt?: string;
  hasPassword?: boolean;
  expiresAt?: string | null;
}

interface UrlTableProps {
  urls?: UrlItem[];
  onUrlClick?: (url: UrlItem) => void;
  onDelete?: (id: string) => void;
  onViewQr?: (url: UrlItem) => void;
}

export function UrlTable({ urls = [], onUrlClick, onDelete, onViewQr }: UrlTableProps) {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filtered = urls.filter(
    (u) =>
      u.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      u.destination.toLowerCase().includes(search.toLowerCase()) ||
      (u.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (shortCode: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${shortCode}`);
    toast({ title: "Copied!", description: "Short URL copied to clipboard" });
  };

  const isExpired = (url: UrlItem) =>
    !!url.expiresAt && new Date(url.expiresAt) < new Date();

  const iconBtn = (onClick: () => void, icon: React.ReactNode, testId: string, danger = false) => (
    <button
      onClick={onClick}
      data-testid={testId}
      className="rounded-lg p-2 transition-all duration-150"
      style={{ color: danger ? "#ef4444" : "rgba(245,245,220,0.60)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = danger ? "rgba(239,68,68,0.12)" : "rgba(255,215,0,0.10)"; (e.currentTarget as HTMLElement).style.color = danger ? "#ef4444" : "#FFD700"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = danger ? "#ef4444" : "rgba(245,245,220,0.60)"; }}
    >
      {icon}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "rgba(245,245,220,0.40)" }} />
        <input
          type="search"
          placeholder="Search by slug, URL, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-urls"
          className="w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.20)", color: "#F5F5DC" }}
          onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.10)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,215,0,0.20)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,215,0,0.15)" }}>
              {["Short URL", "Destination", "Clicks", "Created", "Actions"].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-4 text-xs font-semibold uppercase tracking-wider ${i >= 4 ? "text-right" : i >= 3 ? "hidden lg:table-cell" : i >= 1 ? "hidden md:table-cell" : ""}`}
                  style={{ color: "rgba(255,215,0,0.70)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-sm" style={{ color: "rgba(245,245,220,0.40)" }}>
                  No URLs found
                </td>
              </tr>
            ) : (
              filtered.map((url, idx) => {
                const expired = isExpired(url);
                return (
                  <tr
                    key={url.id}
                    data-testid={`row-url-${url.id}`}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,215,0,0.08)" : "none",
                      transition: "background 0.15s",
                      opacity: expired ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => onUrlClick?.(url)}
                          data-testid={`link-url-${url.id}`}
                          className="font-mono text-sm font-semibold transition-colors text-left"
                          style={{ color: expired ? "#ef4444" : "#FFD700" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                        >
                          /{url.shortCode}
                        </button>
                        <div className="flex items-center gap-1.5">
                          {url.title && (
                            <span className="text-xs" style={{ color: "rgba(245,245,220,0.50)" }}>{url.title}</span>
                          )}
                          {url.hasPassword && (
                            <span title="Password protected" className="flex items-center gap-0.5 text-xs"
                              style={{ color: "rgba(255,215,0,0.60)" }}>
                              <Lock className="h-3 w-3" />
                            </span>
                          )}
                          {expired && (
                            <span className="flex items-center gap-0.5 text-xs" style={{ color: "#ef4444" }}>
                              <Clock className="h-3 w-3" /> expired
                            </span>
                          )}
                          {url.expiresAt && !expired && (
                            <span className="flex items-center gap-0.5 text-xs" style={{ color: "rgba(245,245,220,0.40)" }}>
                              <Clock className="h-3 w-3" />
                              {new Date(url.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-sm text-sm" style={{ color: "rgba(245,245,220,0.60)" }}>
                          {url.destination}
                        </span>
                        <a href={url.destination} target="_blank" rel="noopener noreferrer" data-testid={`link-destination-${url.id}`}>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(245,245,220,0.35)" }} />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.25)" }}
                        data-testid={`badge-clicks-${url.id}`}
                      >
                        {url.clicks}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-5 py-4 text-sm" style={{ color: "rgba(245,245,220,0.45)" }}>
                      {url.created}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-0.5">
                        {iconBtn(() => handleCopy(url.shortCode), <Copy className="h-4 w-4" />, `button-copy-${url.id}`)}
                        {iconBtn(() => onViewQr?.(url), <QrCode className="h-4 w-4" />, `button-qr-${url.id}`)}
                        {iconBtn(() => onDelete?.(url.id), <Trash2 className="h-4 w-4" />, `button-delete-${url.id}`, true)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Link2, MousePointerClick, TrendingUp } from "lucide-react";

interface AnalyticsCardsProps {
  totalUrls?: number;
  totalClicks?: number;
  clicksToday?: number;
}

const STATS = [
  { key: "totalUrls",    label: "Total URLs",    Icon: Link2,            testId: "stat-total-urls" },
  { key: "totalClicks",  label: "Total Clicks",  Icon: MousePointerClick, testId: "stat-total-clicks" },
  { key: "clicksToday",  label: "Clicks Today",  Icon: TrendingUp,        testId: "stat-clicks-today" },
] as const;

export function AnalyticsCards({ totalUrls = 0, totalClicks = 0, clicksToday = 0 }: AnalyticsCardsProps) {
  const values: Record<string, number> = { totalUrls, totalClicks, clicksToday };

  return (
    <div className="grid gap-6 md:grid-cols-3 sfs-stagger">
      {STATS.map(({ key, label, Icon, testId }) => (
        <div
          key={key}
          className="glass-card rounded-2xl p-6 relative overflow-hidden"
          style={{ transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm" style={{ color: "rgba(245,245,220,0.55)" }}>{label}</p>
              <p className="text-4xl font-bold gold-text" data-testid={testId}>
                {values[key].toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl p-2.5"
              style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)" }}>
              <Icon className="h-5 w-5" style={{ color: "#FFD700" }} />
            </div>
          </div>
          {/* Gold accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.40), transparent)" }} />
        </div>
      ))}
    </div>
  );
}

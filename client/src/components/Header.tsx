import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold-800/30"
      style={{
        background: "linear-gradient(135deg, rgba(13,13,13,0.90), rgba(59,47,47,0.70))",
        backdropFilter: "blur(16px) saturate(180%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.50)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{ background: "linear-gradient(135deg, #FFD700, #E6C200)" }}>
              <Zap className="h-5 w-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold gold-text" data-testid="text-app-title">
                LinkShort
              </h1>
              <p className="text-xs" style={{ color: "rgba(245,245,220,0.55)" }}>
                by SmartFlow Systems
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wider"
              style={{ border: "1px solid rgba(255,215,0,0.40)", color: "#FFD700", background: "rgba(255,215,0,0.08)" }}>
              Live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

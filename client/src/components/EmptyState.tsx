import { Link2 } from "lucide-react";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.20)" }}
      >
        <Link2 className="h-12 w-12" style={{ color: "rgba(255,215,0,0.70)" }} />
      </div>
      <h2 className="text-2xl font-bold gold-text mb-2" data-testid="text-empty-title">
        No URLs yet
      </h2>
      <p className="mb-8 max-w-sm text-sm" style={{ color: "rgba(245,245,220,0.55)" }}>
        Create your first short URL to start tracking clicks and generating QR codes
      </p>
      <button
        onClick={onCreateClick}
        data-testid="button-create-first"
        className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200"
        style={{ background: "linear-gradient(135deg, #FFD700, #E6C200)", color: "#0D0D0D", boxShadow: "0 4px 16px rgba(255,215,0,0.35)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(255,215,0,0.50)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(255,215,0,0.35)"; }}
      >
        Create Your First URL
      </button>
    </div>
  );
}

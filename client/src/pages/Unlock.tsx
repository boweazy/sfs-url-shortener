import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Lock, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Unlock() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("POST", `/api/urls/${shortCode}/unlock`, { password });
      const data = await res.json();
      if (data.ok) {
        window.location.href = data.destination;
      } else {
        setError("Wrong password. Try again.");
      }
    } catch {
      setError("Wrong password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0D0D0D" }}>
      <div className="glass-card rounded-2xl p-10 w-full max-w-md text-center sfs-animate-scale-in">
        <div className="flex justify-center mb-6">
          <div className="rounded-2xl p-5"
            style={{ background: "rgba(255,215,0,0.10)", border: "1px solid rgba(255,215,0,0.30)" }}>
            <Lock className="h-10 w-10" style={{ color: "#FFD700" }} />
          </div>
        </div>
        <h1 className="text-2xl font-bold gold-text mb-2">Protected Link</h1>
        <p className="text-sm mb-8" style={{ color: "rgba(245,245,220,0.55)" }}>
          <code className="font-mono" style={{ color: "rgba(255,215,0,0.80)" }}>/{shortCode}</code> requires a password to access
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            data-testid="input-unlock-password"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${error ? "#ef4444" : "rgba(255,215,0,0.25)"}`, color: "#F5F5DC" }}
            onFocus={(e) => { if (!error) { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.15)"; } }}
            onBlur={(e) => { if (!error) { e.target.style.borderColor = "rgba(255,215,0,0.25)"; e.target.style.boxShadow = "none"; } }}
          />
          {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
          <button type="submit" disabled={loading}
            data-testid="button-unlock"
            className="w-full rounded-full py-3.5 text-sm font-semibold transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #FFD700, #E6C200)", color: "#0D0D0D", boxShadow: "0 4px 16px rgba(255,215,0,0.35)" }}>
            {loading ? "Checking..." : "Unlock & Redirect"}
          </button>
        </form>

        <button onClick={() => navigate("/")}
          className="mt-6 flex items-center justify-center gap-2 mx-auto text-sm transition-colors"
          style={{ color: "rgba(245,245,220,0.45)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FFD700"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(245,245,220,0.45)"; }}>
          <ArrowLeft className="h-4 w-4" />
          Back to LinkShort
        </button>
      </div>
    </div>
  );
}

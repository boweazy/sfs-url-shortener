import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
}

export function ApiKeysPanel() {
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<{ name: string; plaintextKey: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const { data: keys = [] } = useQuery<ApiKeyRow[]>({ queryKey: ["/api/keys"] });

  const createMutation = useMutation({
    mutationFn: (keyName: string) => apiRequest("POST", "/api/keys", { name: keyName }),
    onSuccess: async (res) => {
      const data = await res.json();
      setNewKey(data);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "Key revoked" });
    },
  });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "API key copied to clipboard" });
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-2.5" style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)" }}>
          <Key className="h-5 w-5" style={{ color: "#FFD700" }} />
        </div>
        <div>
          <h3 className="font-bold gold-text text-lg">API Keys</h3>
          <p className="text-xs" style={{ color: "rgba(245,245,220,0.55)" }}>Use keys to access the API programmatically</p>
        </div>
      </div>

      {/* Create new key */}
      <div className="flex gap-3">
        <input
          placeholder="Key name (e.g. My App)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && createMutation.mutate(name.trim())}
          data-testid="input-api-key-name"
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.25)", color: "#F5F5DC" }}
          onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.15)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,215,0,0.25)"; e.target.style.boxShadow = "none"; }}
        />
        <button
          onClick={() => name.trim() && createMutation.mutate(name.trim())}
          disabled={!name.trim() || createMutation.isPending}
          data-testid="button-create-api-key"
          className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all"
          style={{ background: "linear-gradient(135deg, #FFD700, #E6C200)", color: "#0D0D0D", opacity: !name.trim() ? 0.5 : 1 }}>
          <Plus className="h-4 w-4" />
          Generate
        </button>
      </div>

      {/* Newly created key — shown once */}
      {newKey && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.30)" }}>
          <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>Key created for "{newKey.name}" — copy it now, it won't be shown again!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs rounded-lg px-3 py-2 font-mono"
              style={{ background: "rgba(0,0,0,0.30)", color: "#22c55e" }}>
              {showKey ? newKey.plaintextKey : newKey.plaintextKey.replace(/./g, "•")}
            </code>
            <button onClick={() => setShowKey(!showKey)} className="rounded-lg p-2 transition-all"
              style={{ color: "#22c55e" }}>
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={() => copy(newKey.plaintextKey)} className="rounded-lg p-2 transition-all"
              style={{ color: "#22c55e" }}>
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="rounded-lg p-3 text-xs font-mono space-y-1" style={{ background: "rgba(0,0,0,0.30)", color: "rgba(245,245,220,0.60)" }}>
            <p style={{ color: "rgba(245,245,220,0.40)" }}># Example usage</p>
            <p>curl -H "X-API-Key: {newKey.plaintextKey.slice(0, 16)}..." \</p>
            <p>  -d '{`{"destination":"https://example.com"}`}' \</p>
            <p>  {window.location.origin}/api/v1/urls</p>
          </div>
        </div>
      )}

      {/* Key list */}
      <div className="space-y-2">
        {keys.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "rgba(245,245,220,0.40)" }}>No API keys yet</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.14)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "#F5F5DC" }}>{k.name}</p>
                <p className="text-xs font-mono" style={{ color: "rgba(245,245,220,0.45)" }}>{k.keyPrefix}••••••••••••</p>
              </div>
              <button onClick={() => deleteMutation.mutate(k.id)} data-testid={`button-revoke-key-${k.id}`}
                className="rounded-lg p-2 transition-all"
                style={{ color: "#ef4444" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* API reference */}
      <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(0,0,0,0.30)", border: "1px solid rgba(255,215,0,0.14)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,215,0,0.60)" }}>API Reference</p>
        <div className="text-xs font-mono space-y-1" style={{ color: "rgba(245,245,220,0.55)" }}>
          <p><span style={{ color: "#22c55e" }}>POST</span> /api/v1/urls — Create short URL</p>
          <p><span style={{ color: "#60a5fa" }}>GET</span>  /api/v1/urls — List all URLs</p>
          <p className="mt-1" style={{ color: "rgba(245,245,220,0.35)" }}>Header: X-API-Key: {"<your-key>"}</p>
        </div>
      </div>
    </div>
  );
}

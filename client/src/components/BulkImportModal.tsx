import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { X, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkImportModalProps {
  onClose: () => void;
}

interface BulkResult {
  shortCode: string;
  destination: string;
  status: string;
}

export function BulkImportModal({ onClose }: BulkImportModalProps) {
  const [csv, setCsv] = useState("destination,shortCode\nhttps://google.com,g\nhttps://github.com,gh");
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (csvText: string) => apiRequest("POST", "/api/urls/bulk", { csv: csvText }),
    onSuccess: async (res) => {
      const data = await res.json();
      setResults(data.results);
      queryClient.invalidateQueries({ queryKey: ["/api/urls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      toast({ title: "Bulk import done!", description: `${data.results.filter((r: BulkResult) => r.status === "created").length} URLs created` });
    },
    onError: () => toast({ title: "Import failed", variant: "destructive" }),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsv(ev.target?.result as string);
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gold-text">Bulk Import URLs</h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-all"
            style={{ color: "rgba(245,245,220,0.60)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.10)"; (e.currentTarget as HTMLElement).style.color = "#FFD700"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "rgba(245,245,220,0.60)"; }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: "rgba(245,245,220,0.55)" }}>
          Upload a CSV file or paste CSV content. Required column: <code className="text-yellow-400">destination</code>. Optional: <code className="text-yellow-400">shortCode</code>.
        </p>

        {/* File upload */}
        <label className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3 mb-4 transition-all"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px dashed rgba(255,215,0,0.35)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.14)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.08)"; }}>
          <Upload className="h-5 w-5" style={{ color: "#FFD700" }} />
          <span className="text-sm font-medium" style={{ color: "#FFD700" }}>Upload CSV file</span>
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" data-testid="input-csv-file" />
        </label>

        <div className="space-y-2 mb-5">
          <label className="block text-sm font-medium" style={{ color: "#F5F5DC" }}>Or paste CSV</label>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={6}
            data-testid="input-csv-text"
            className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all resize-y"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.25)", color: "#F5F5DC" }}
            onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.15)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,215,0,0.25)"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <button
          onClick={() => mutation.mutate(csv)}
          disabled={mutation.isPending || !csv.trim()}
          data-testid="button-bulk-import"
          className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold mb-6"
          style={{ background: "linear-gradient(135deg, #FFD700, #E6C200)", color: "#0D0D0D", boxShadow: "0 4px 16px rgba(255,215,0,0.35)", opacity: mutation.isPending ? 0.6 : 1 }}>
          <Upload className="h-4 w-4" />
          {mutation.isPending ? "Importing..." : "Import URLs"}
        </button>

        {/* Results */}
        {results && (
          <div className="space-y-2">
            <p className="text-sm font-semibold gold-text mb-3">
              {results.filter(r => r.status === "created").length} of {results.length} created
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ background: r.status === "created" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)" }}>
                  {r.status === "created"
                    ? <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "#22c55e" }} />
                    : <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />}
                  <span className="text-xs font-mono truncate" style={{ color: r.status === "created" ? "#22c55e" : "#ef4444" }}>
                    {r.shortCode && `/${r.shortCode}`} {r.destination} — {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

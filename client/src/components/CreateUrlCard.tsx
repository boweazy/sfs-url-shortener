import { useState } from "react";
import { Sparkles } from "lucide-react";

interface CreateUrlCardProps {
  onSubmit?: (data: { url: string; customSlug: string; generateQr: boolean }) => void;
  isPending?: boolean;
}

export function CreateUrlCard({ onSubmit, isPending }: CreateUrlCardProps) {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [generateQr, setGenerateQr] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ url, customSlug, generateQr });
    setUrl("");
    setCustomSlug("");
  };

  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold gold-text">Create Short URL</h2>
        <p className="mt-1 text-sm" style={{ color: "rgba(245,245,220,0.55)" }}>
          Transform long URLs into shareable short links with optional custom slugs
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Destination URL */}
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: "#F5F5DC" }}>
            Destination URL
          </label>
          <input
            id="destination-url"
            type="url"
            placeholder="https://example.com/very/long/url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            data-testid="input-destination-url"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,215,0,0.25)",
              color: "#F5F5DC",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.15)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,215,0,0.25)"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Custom Slug */}
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: "#F5F5DC" }}>
            Custom Slug <span style={{ color: "rgba(245,245,220,0.55)" }}>(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm shrink-0" style={{ color: "rgba(245,245,220,0.55)" }}>
              {window.location.origin}/
            </span>
            <input
              id="custom-slug"
              placeholder="my-link"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              data-testid="input-custom-slug"
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,215,0,0.25)",
                color: "#F5F5DC",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#FFD700"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.15)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,215,0,0.25)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* QR toggle */}
        <div className="flex items-center justify-between rounded-xl p-4"
          style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.18)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "#F5F5DC" }}>Generate QR Code</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(245,245,220,0.55)" }}>
              Create a scannable QR code for this URL
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGenerateQr(!generateQr)}
            data-testid="switch-generate-qr"
            className="relative h-6 w-11 rounded-full transition-all duration-200 outline-none"
            style={{
              background: generateQr ? "#FFD700" : "rgba(255,255,255,0.12)",
              border: generateQr ? "none" : "1px solid rgba(255,215,0,0.30)",
            }}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200"
              style={{
                background: generateQr ? "#0D0D0D" : "rgba(245,245,220,0.60)",
                left: generateQr ? "calc(100% - 1.375rem)" : "2px",
              }}
            />
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          data-testid="button-create-url"
          className="w-full flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all duration-200"
          style={{
            background: isPending ? "rgba(255,215,0,0.40)" : "linear-gradient(135deg, #FFD700, #E6C200)",
            color: "#0D0D0D",
            boxShadow: isPending ? "none" : "0 4px 16px rgba(255,215,0,0.35)",
          }}
          onMouseEnter={(e) => { if (!isPending) { (e.target as HTMLElement).style.transform = "translateY(-2px)"; (e.target as HTMLElement).style.boxShadow = "0 8px 24px rgba(255,215,0,0.50)"; } }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = ""; (e.target as HTMLElement).style.boxShadow = isPending ? "none" : "0 4px 16px rgba(255,215,0,0.35)"; }}
        >
          <Sparkles className="h-4 w-4" />
          {isPending ? "Creating..." : "Create Short URL"}
        </button>
      </form>
    </div>
  );
}

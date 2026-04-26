import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";

interface QrCodeDisplayProps {
  url: string;
  shortCode?: string;
}

export function QrCodeDisplay({ url, shortCode }: QrCodeDisplayProps) {
  const handleDownload = () => {
    const svg = document.getElementById("qr-code") as SVGElement | null;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    canvas.width = 300;
    canvas.height = 300;
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `qr-${shortCode || "code"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold gold-text">QR Code</h3>
      <div className="flex justify-center rounded-xl p-5" style={{ background: "#ffffff" }}>
        <QRCodeSVG id="qr-code" value={url} size={220} level="H" data-testid="qr-code" />
      </div>
      <button
        onClick={handleDownload}
        data-testid="button-download-qr"
        className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all duration-200"
        style={{
          background: "rgba(255,215,0,0.10)",
          border: "1px solid rgba(255,215,0,0.35)",
          color: "#FFD700",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.18)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.10)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
      >
        <Download className="h-4 w-4" />
        Download PNG
      </button>
    </div>
  );
}

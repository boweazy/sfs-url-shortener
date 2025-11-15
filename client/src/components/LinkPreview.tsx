import { useEffect, useState } from "react";
import { Loader2, Globe, Image as ImageIcon } from "lucide-react";

export interface LinkMetadata {
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

interface LinkPreviewProps {
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url || url.length < 10) {
      setMetadata(null);
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      setMetadata(null);
      return;
    }

    setError(false);
    setLoading(true);

    // Debounce API call
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/links/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch preview');
        }

        const data = await response.json();
        setMetadata(data);
        setError(false);
      } catch (err) {
        console.error('Preview failed:', err);
        setError(true);
        setMetadata(null);
      } finally {
        setLoading(false);
      }
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timer);
  }, [url]);

  if (!url || url.length < 10) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading preview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <Globe className="h-4 w-4" />
          <span className="text-sm">Could not load preview for this URL</span>
        </div>
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <div className="rounded-lg border border-border bg-card hover-elevate transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3 text-xs text-muted-foreground mb-3">
          {metadata.favicon && (
            <img
              src={metadata.favicon}
              alt=""
              className="w-4 h-4 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span className="font-medium">{metadata.siteName}</span>
        </div>

        <div className="flex gap-4">
          {metadata.image ? (
            <div className="flex-shrink-0">
              <img
                src={metadata.image}
                alt={metadata.title}
                className="w-24 h-24 rounded-md object-cover bg-muted"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.className = 'w-24 h-24 rounded-md bg-muted flex items-center justify-center';
                }}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-24 h-24 rounded-md bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
              {metadata.title}
            </h3>
            {metadata.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {metadata.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

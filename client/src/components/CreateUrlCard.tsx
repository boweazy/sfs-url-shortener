import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateLink } from "@/lib/api";
import { LinkPreview } from "./LinkPreview";

export function CreateUrlCard() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [generateQr, setGenerateQr] = useState(true);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const { toast } = useToast();
  const createLink = useCreateLink();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createLink.mutateAsync({
        url,
        customSlug: customSlug || undefined,
        qrCodeEnabled: generateQr,
      });

      setGeneratedUrl(result.link.shortUrl);
      setUrl("");
      setCustomSlug("");

      toast({
        title: "Success!",
        description: "Short URL created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create link",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    toast({
      title: "Copied!",
      description: "Short URL copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader className="gap-1 space-y-0 pb-4">
        <CardTitle className="text-2xl">Create Short URL</CardTitle>
        <CardDescription>
          Transform long URLs into shareable short links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination-url">Destination URL</Label>
            <Input
              id="destination-url"
              type="url"
              placeholder="https://example.com/very/long/url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              data-testid="input-destination-url"
            />
          </div>

          {url && <LinkPreview url={url} />}

          <div className="space-y-2">
            <Label htmlFor="custom-slug">
              Custom Slug <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {window.location.origin}/
              </span>
              <Input
                id="custom-slug"
                placeholder="my-link"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                data-testid="input-custom-slug"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="generate-qr" className="cursor-pointer">
                Generate QR Code
              </Label>
              <p className="text-sm text-muted-foreground">
                Create a scannable QR code for this URL
              </p>
            </div>
            <Switch
              id="generate-qr"
              checked={generateQr}
              onCheckedChange={setGenerateQr}
              data-testid="switch-generate-qr"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            data-testid="button-create-url"
            disabled={createLink.isPending}
          >
            {createLink.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Short URL
              </>
            )}
          </Button>

          {generatedUrl && (
            <div className="rounded-md border border-border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-2">Your short URL:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm" data-testid="text-generated-url">
                  {generatedUrl}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  data-testid="button-copy-url"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

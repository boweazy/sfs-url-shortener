import * as cheerio from 'cheerio';

export interface LinkMetadata {
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SFS-Link-Bot/1.0; +https://sfs.link/bot)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata (prioritize Open Graph, then Twitter, then fallbacks)
    const metadata: LinkMetadata = {
      title:
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text().trim() ||
        parsedUrl.hostname,

      description:
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        '',

      image:
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        '',

      siteName:
        $('meta[property="og:site_name"]').attr('content') ||
        parsedUrl.hostname,

      favicon:
        $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        `${parsedUrl.protocol}//${parsedUrl.hostname}/favicon.ico`,
    };

    // Make relative URLs absolute
    if (metadata.image && !metadata.image.startsWith('http')) {
      metadata.image = new URL(metadata.image, url).toString();
    }
    if (metadata.favicon && !metadata.favicon.startsWith('http')) {
      metadata.favicon = new URL(metadata.favicon, url).toString();
    }

    return metadata;
  } catch (error) {
    console.error('Failed to fetch metadata for', url, error);

    // Return fallback data
    try {
      const parsedUrl = new URL(url);
      return {
        title: parsedUrl.hostname,
        description: '',
        image: '',
        siteName: parsedUrl.hostname,
        favicon: `${parsedUrl.protocol}//${parsedUrl.hostname}/favicon.ico`,
      };
    } catch {
      return {
        title: 'Invalid URL',
        description: '',
        image: '',
        siteName: '',
        favicon: '',
      };
    }
  }
}

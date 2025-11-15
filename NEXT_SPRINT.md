# 🎯 NEXT SPRINT: Make SFS Link Unstoppable

## 🏆 Top 5 Features to Build This Week

These features will **immediately** differentiate us from Bitly and generate revenue.

---

## 1. 🖼️ Real-Time Link Preview (Day 1-2)

### Why This Wins
- **User delight**: Auto-fills title/description
- **Reduces errors**: See what you're shortening
- **Professional**: Shows we care about details

### Implementation

#### Backend: Add metadata fetcher
```typescript
// server/metadata.ts
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

interface LinkMetadata {
  title: string;
  description: string;
  image: string;
  siteName: string;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SFS-Link-Bot/1.0)',
      },
      timeout: 5000,
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Open Graph tags (Facebook, LinkedIn, Twitter)
    const metadata: LinkMetadata = {
      title:
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text() ||
        'Untitled',

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
        new URL(url).hostname,
    };

    return metadata;
  } catch (error) {
    console.error('Failed to fetch metadata:', error);
    return {
      title: 'Failed to fetch',
      description: '',
      image: '',
      siteName: new URL(url).hostname,
    };
  }
}
```

#### Add API endpoint
```typescript
// server/routes.ts
app.post("/api/links/preview", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL required" });
    }

    const metadata = await fetchLinkMetadata(url);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch preview" });
  }
});
```

#### Frontend: Live preview component
```typescript
// client/src/components/LinkPreview.tsx
export function LinkPreview({ url }: { url: string }) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/links/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error('Preview failed:', error);
      }
      setLoading(false);
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [url]);

  if (!metadata) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Preview</p>
      <div className="flex gap-3">
        {metadata.image && (
          <img
            src={metadata.image}
            alt={metadata.title}
            className="w-20 h-20 rounded object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{metadata.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {metadata.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {metadata.siteName}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Packages needed:**
```bash
npm install cheerio node-fetch
npm install -D @types/node-fetch
```

---

## 2. 🔄 Smart Link Rotation (Day 2-3)

### Why This Wins
- **Premium feature**: Bitly charges $500/mo for this
- **High value**: A/B testing, geo-targeting
- **Competitive edge**: Most shorteners don't have this

### Implementation

#### Schema update
```typescript
// shared/schema.ts - Add to links table
export const links = pgTable("links", {
  // ... existing fields ...

  // Rotation settings
  rotationType: text("rotation_type"), // null | "ab_test" | "round_robin" | "geo" | "time"
  rotationTargets: text("rotation_targets"), // JSON array of URLs

  // Example:
  // rotationType: "ab_test"
  // rotationTargets: JSON.stringify([
  //   { url: "https://landing-a.com", weight: 50 },
  //   { url: "https://landing-b.com", weight: 50 }
  // ])
});
```

#### Backend logic
```typescript
// server/rotation.ts
interface RotationTarget {
  url: string;
  weight: number;
  geoRestriction?: string[]; // ["US", "CA", "UK"]
  timeRestriction?: { start: string; end: string };
}

export function selectRotationTarget(
  targets: RotationTarget[],
  userCountry?: string,
  currentTime?: Date
): string {
  // Filter by geo
  let eligible = targets;
  if (userCountry) {
    eligible = targets.filter(t =>
      !t.geoRestriction || t.geoRestriction.includes(userCountry)
    );
  }

  // Filter by time
  if (currentTime) {
    eligible = eligible.filter(t => {
      if (!t.timeRestriction) return true;
      const hour = currentTime.getHours();
      const start = parseInt(t.timeRestriction.start);
      const end = parseInt(t.timeRestriction.end);
      return hour >= start && hour < end;
    });
  }

  // Weighted random selection
  const totalWeight = eligible.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;

  for (const target of eligible) {
    random -= target.weight;
    if (random <= 0) return target.url;
  }

  return eligible[0]?.url || targets[0].url;
}
```

#### Update redirect logic
```typescript
// server/routes.ts - Modify /:shortCode handler
app.get("/:shortCode", async (req: Request, res: Response, next) => {
  // ... existing code ...

  let destinationUrl = link.originalUrl;

  // Handle rotation
  if (link.rotationType && link.rotationTargets) {
    const targets = JSON.parse(link.rotationTargets);
    destinationUrl = selectRotationTarget(
      targets,
      req.headers['cf-ipcountry'] as string, // Cloudflare provides this
      new Date()
    );
  }

  res.redirect(301, destinationUrl);
});
```

#### Frontend UI
```typescript
// client/src/components/LinkRotationSettings.tsx
export function LinkRotationSettings() {
  const [rotationType, setRotationType] = useState<string>('none');
  const [targets, setTargets] = useState<RotationTarget[]>([
    { url: '', weight: 50 },
    { url: '', weight: 50 },
  ]);

  return (
    <div className="space-y-4">
      <Label>Link Rotation Type</Label>
      <Select value={rotationType} onValueChange={setRotationType}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Rotation</SelectItem>
          <SelectItem value="ab_test">A/B Test (50/50 split)</SelectItem>
          <SelectItem value="round_robin">Round Robin</SelectItem>
          <SelectItem value="geo">Geographic Targeting</SelectItem>
          <SelectItem value="time">Time-Based</SelectItem>
        </SelectContent>
      </Select>

      {rotationType !== 'none' && (
        <div className="space-y-3">
          {targets.map((target, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="https://landing-page.com"
                value={target.url}
                onChange={(e) => {
                  const newTargets = [...targets];
                  newTargets[index].url = e.target.value;
                  setTargets(newTargets);
                }}
              />
              <Input
                type="number"
                placeholder="Weight %"
                value={target.weight}
                className="w-24"
                onChange={(e) => {
                  const newTargets = [...targets];
                  newTargets[index].weight = parseInt(e.target.value);
                  setTargets(newTargets);
                }}
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => setTargets([...targets, { url: '', weight: 0 }])}
          >
            + Add Destination
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## 3. 🏥 Link Health Monitoring (Day 3-4)

### Why This Wins
- **Prevents disasters**: No more broken links
- **Professional**: Enterprise feature
- **Email alerts**: Proactive monitoring

### Implementation

#### Add health status to schema
```typescript
// shared/schema.ts
export const links = pgTable("links", {
  // ... existing fields ...

  healthStatus: text("health_status").default("healthy"), // "healthy" | "broken" | "slow" | "checking"
  lastHealthCheck: timestamp("last_health_check"),
  responseTime: integer("response_time"), // milliseconds
});
```

#### Health checker service
```typescript
// server/healthChecker.ts
import cron from 'node-cron';

interface HealthCheckResult {
  status: 'healthy' | 'broken' | 'slow';
  statusCode: number;
  responseTime: number;
  error?: string;
}

async function checkLinkHealth(url: string): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'HEAD', // Faster than GET
      timeout: 10000,
      redirect: 'follow',
    });

    const responseTime = Date.now() - startTime;

    return {
      status: response.ok
        ? (responseTime > 3000 ? 'slow' : 'healthy')
        : 'broken',
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    return {
      status: 'broken',
      statusCode: 0,
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

// Run every 6 hours
export function startHealthChecker() {
  cron.schedule('0 */6 * * *', async () => {
    console.log('Starting health check...');

    const allLinks = await storage.getAllLinks();

    for (const link of allLinks) {
      const health = await checkLinkHealth(link.originalUrl);

      await storage.updateLink(link.id, {
        healthStatus: health.status,
        lastHealthCheck: new Date(),
        responseTime: health.responseTime,
      });

      // Send alert if broken
      if (health.status === 'broken') {
        await sendBrokenLinkAlert(link);
      }
    }
  });
}

async function sendBrokenLinkAlert(link: Link) {
  // TODO: Implement email notification
  console.error(`⚠️ Link broken: ${link.shortCode} -> ${link.originalUrl}`);
}
```

#### Frontend health indicator
```typescript
// client/src/components/HealthBadge.tsx
export function HealthBadge({ status }: { status: string }) {
  const variants = {
    healthy: { color: 'bg-green-500', text: 'Healthy' },
    slow: { color: 'bg-yellow-500', text: 'Slow' },
    broken: { color: 'bg-red-500', text: 'Broken' },
    checking: { color: 'bg-gray-500', text: 'Checking...' },
  };

  const { color, text } = variants[status] || variants.healthy;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
```

**Packages needed:**
```bash
npm install node-cron
npm install -D @types/node-cron
```

---

## 4. 📊 Campaign Dashboard (Day 4-5)

### Why This Wins
- **How marketers think**: Group links by campaign
- **ROI tracking**: Measure campaign success
- **Beautiful visuals**: Impress stakeholders

### Implementation

#### Add campaigns table
```typescript
// shared/schema.ts
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),

  // Budget tracking
  budget: integer("budget"), // in cents
  goalClicks: integer("goal_clicks"),
  goalConversions: integer("goal_conversions"),

  // Dates
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add campaign_id to links table
export const links = pgTable("links", {
  // ... existing fields ...
  campaignId: varchar("campaign_id").references(() => campaigns.id),
});
```

#### Frontend campaign view
```typescript
// client/src/pages/Campaigns.tsx
export default function CampaignsPage() {
  const { data: campaigns } = useCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Button>+ New Campaign</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id} className="hover-elevate">
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription>{campaign.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Clicks</span>
                    <span className="font-semibold">
                      {campaign.totalClicks} / {campaign.goalClicks}
                    </span>
                  </div>
                  <Progress
                    value={(campaign.totalClicks / campaign.goalClicks) * 100}
                  />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Links</p>
                    <p className="text-2xl font-bold">{campaign.linkCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className="text-2xl font-bold">
                      {campaign.ctr.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Date range */}
                <div className="text-xs text-muted-foreground">
                  {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. 🔌 API + Webhooks (Day 5-7)

### Why This Wins
- **Enterprise sales**: APIs = serious business
- **Integrations**: Unlock Zapier, Make, n8n
- **Developer community**: Free marketing

### Implementation

#### API authentication
```typescript
// shared/schema.ts
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  key: text("key").notNull().unique(), // sfs_live_abc123xyz
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### API middleware
```typescript
// server/apiAuth.ts
export async function requireApiKey(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const key = await storage.getApiKeyByKey(apiKey);
  if (!key) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Attach workspace to request
  req.workspaceId = key.workspaceId;

  // Update last used
  await storage.updateApiKey(key.id, { lastUsed: new Date() });

  next();
}
```

#### API endpoints
```typescript
// server/routes.ts
// Public API (requires API key)
app.use('/api/v1', requireApiKey);

// GET /api/v1/links
app.get('/api/v1/links', async (req: Request, res: Response) => {
  const links = await storage.getLinksByWorkspaceId(req.workspaceId);
  res.json({ links });
});

// POST /api/v1/links
app.post('/api/v1/links', async (req: Request, res: Response) => {
  // Same as internal API, but use req.workspaceId
});

// GET /api/v1/links/:id/analytics
app.get('/api/v1/links/:id/analytics', async (req: Request, res: Response) => {
  // Return detailed analytics
});
```

#### Webhooks
```typescript
// server/webhooks.ts
export async function triggerWebhook(
  workspaceId: string,
  event: string,
  data: any
) {
  const webhooks = await storage.getWebhooksByWorkspace(workspaceId);

  for (const webhook of webhooks) {
    if (webhook.events.includes(event)) {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SFS-Event': event,
          'X-SFS-Signature': generateSignature(webhook.secret, data),
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data,
        }),
      });
    }
  }
}

// Trigger on link click
app.get("/:shortCode", async (req: Request, res: Response, next) => {
  // ... existing code ...

  // After recording click
  await triggerWebhook(link.workspaceId, 'link.clicked', {
    linkId: link.id,
    shortCode: link.shortCode,
    destination: link.originalUrl,
    clicks: link.clicks + 1,
  });
});
```

---

## 📦 Package Installation

```bash
# All dependencies needed
npm install cheerio node-fetch node-cron nanoid
npm install -D @types/node-fetch @types/node-cron
```

---

## 🎯 Success Criteria

After this sprint:
- ✅ **10x better UX** than competitors
- ✅ **2 enterprise features** (API + Rotation)
- ✅ **Reliability** that justifies premium pricing
- ✅ **Beautiful campaigns** that marketers will screenshot

---

## 🚀 Launch Strategy

1. **Soft launch** with 50 beta users
2. **Product Hunt** launch after 2 weeks
3. **Reddit** (r/marketing, r/entrepreneur)
4. **Twitter** thread showing features
5. **Cold email** to marketing agencies

---

**Expected Impact:**
- 5-10 paying customers within 30 days
- $500-1,000 MRR
- Proof of concept for investors

Let's build this! 🔥

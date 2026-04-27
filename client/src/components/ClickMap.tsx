import { useQuery } from "@tanstack/react-query";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country name → ISO alpha-2 code (subset for common countries)
// react-simple-maps uses numeric IDs from topojson; we need to match by country name
// We'll match on ISO 3166-1 alpha-2 from our data against the topojson numeric codes

interface GeoData {
  country: string;
  count: number;
}

interface ClickMapProps {
  urlId: string;
}

function getColor(count: number, max: number): string {
  if (!count) return "rgba(59,47,47,0.40)";
  const intensity = Math.pow(count / max, 0.5);
  const alpha = 0.25 + intensity * 0.75;
  return `rgba(255,215,0,${alpha.toFixed(2)})`;
}

export function ClickMap({ urlId }: ClickMapProps) {
  const { data: geoData = [], isLoading } = useQuery<GeoData[]>({
    queryKey: ["/api/urls", urlId, "geography"],
  });

  const max = Math.max(...geoData.map(g => g.count), 1);
  const countByCountry = Object.fromEntries(geoData.map(g => [g.country, g.count]));

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold gold-text">Click Map</h3>
        {geoData.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full"
            style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.25)" }}>
            {geoData.length} {geoData.length === 1 ? "country" : "countries"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-48 rounded-xl animate-pulse" style={{ background: "rgba(255,215,0,0.06)" }} />
      ) : (
        <>
          <div className="rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.30)" }}>
            <ComposableMap
              projectionConfig={{ scale: 130 }}
              style={{ width: "100%", height: "auto" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const isoA2 = geo.properties?.["Alpha-2"] || geo.properties?.iso_a2 || "";
                    const count = countByCountry[isoA2] || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getColor(count, max)}
                        stroke="rgba(255,215,0,0.12)"
                        strokeWidth={0.4}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "rgba(255,215,0,0.60)", outline: "none" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          {geoData.length === 0 ? (
            <p className="text-center text-sm mt-4" style={{ color: "rgba(245,245,220,0.40)" }}>
              No geographic data yet — clicks will appear here
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {geoData.slice(0, 8).map(({ country, count }) => (
                <span key={country} className="text-xs rounded-full px-3 py-1 font-medium"
                  style={{ background: "rgba(255,215,0,0.10)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.22)" }}>
                  {country} · {count}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

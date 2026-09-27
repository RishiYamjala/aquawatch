import { useState } from "react";
import { ArrowUpRight, LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import { MapView } from "@/components/Map";

type Risk = "LOW" | "MODERATE" | "HIGH";
type ZoneSummary = {
  zone: string;
  current: unknown[];
  risk: Risk;
};

const SAMPLE_LOCATIONS: Record<string, google.maps.LatLngLiteral> = {
  "Riverside Colony": { lat: 28.6518, lng: 77.2386 },
  "Sector 12": { lat: 28.6139, lng: 77.2089 },
  "Old Town": { lat: 28.6631, lng: 77.2244 },
  "Green Park": { lat: 28.5584, lng: 77.206 },
  Lakeview: { lat: 28.6842, lng: 77.2527 },
};

const RISK_COLORS: Record<Risk, string> = {
  LOW: "#46b887",
  MODERATE: "#e3b44f",
  HIGH: "#ed796b",
};

export function NeighborhoodMap({
  summaries,
  onSelectZone,
}: {
  summaries: ZoneSummary[];
  onSelectZone: (zone: string) => void;
}) {
  const [mapError, setMapError] = useState(false);

  const placeMarkers = (map: google.maps.Map) => {
    map.setOptions({
      colorScheme: google.maps.ColorScheme.DARK,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "cooperative",
    });

    summaries.forEach((summary) => {
      const position = SAMPLE_LOCATIONS[summary.zone];
      if (!position || !window.google?.maps?.marker) return;

      const markerContent = document.createElement("div");
      markerContent.className = `neighborhood-map-marker risk-${summary.risk.toLowerCase()}`;
        markerContent.style.setProperty("--marker-color", RISK_COLORS[summary.risk]);
        markerContent.innerHTML = `<span>${summary.current.length}</span>`;

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position,
          title: `${summary.zone}: ${summary.risk.toLowerCase()} risk, ${summary.current.length} reports in 48 hours`,
          content: markerContent,
          gmpClickable: true,
          zIndex: summary.risk === "HIGH" ? 3 : summary.risk === "MODERATE" ? 2 : 1,
        });
      marker.addListener("click", () => onSelectZone(summary.zone));
    });
  };

  return (
    <section className="neighborhood-map-section" aria-labelledby="neighborhood-map-title">
      <div className="map-panel-heading">
        <div>
          <span className="eyebrow"><LocateFixed size={12} /> GEOGRAPHIC SIGNAL</span>
          <h3 id="neighborhood-map-title">Neighborhood map</h3>
          <p>Explore community signals by area.</p>
        </div>
        <span className="map-sample-label"><span className="map-sample-dot" /> SAMPLE LOCATIONS · DELHI</span>
      </div>

      <div className="neighborhood-map-layout">
        <div className={`neighborhood-map-canvas ${mapError ? "map-load-error" : ""}`}>
          {!mapError ? (
            <MapView
              className="neighborhood-google-map"
              initialCenter={{ lat: 28.625, lng: 77.229 }}
              initialZoom={11}
              onMapReady={placeMarkers}
              onMapError={() => setMapError(true)}
            />
          ) : (
            <div className="map-fallback" role="status">
              <MapPin size={23} />
              <b>Map tiles couldn’t load</b>
              <span>Choose an area from the location list to view its signal.</span>
            </div>
          )}
          {!mapError && <span className="map-overlay-label"><LocateFixed size={13} /> Community signals</span>}
        </div>

        <aside className="map-zone-list" aria-label="Neighborhood map locations">
          <div className="map-zone-list-heading">
            <span>MONITORED AREAS</span>
            <b>{summaries.length}</b>
          </div>
          <div className="map-zone-items">
            {summaries.map((summary) => (
              <button className="map-zone-item" key={summary.zone} onClick={() => onSelectZone(summary.zone)}>
                <span className={`map-zone-pin risk-${summary.risk.toLowerCase()}`}>
                  <MapPin size={15} fill="currentColor" />
                </span>
                <span className="map-zone-copy">
                  <b>{summary.zone}</b>
                  <small>{summary.current.length} reports · 48h · {summary.risk.toLowerCase()} risk</small>
                </span>
                <span className={`map-zone-count risk-${summary.risk.toLowerCase()}`}>{summary.current.length}</span>
                <ArrowUpRight className="map-zone-arrow" size={14} />
              </button>
            ))}
          </div>
          <div className="map-privacy-note"><ShieldCheck size={14} /> No household-level locations are shown.</div>
        </aside>
      </div>
      <p className="map-disclaimer">Illustrative neighborhood placements around Delhi; sample data only, not verified service-area boundaries.</p>
    </section>
  );
}

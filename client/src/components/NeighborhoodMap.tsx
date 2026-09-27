import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Risk = "LOW" | "MODERATE" | "HIGH";
type ZoneSummary = {
  zone: string;
  current: unknown[];
  risk: Risk;
};

const SAMPLE_LOCATIONS: Record<string, L.LatLngTuple> = {
  "Riverside Colony": [28.6518, 77.2386],
  "Sector 12": [28.6139, 77.2089],
  "Old Town": [28.6631, 77.2244],
  "Green Park": [28.5584, 77.206],
  Lakeview: [28.6842, 77.2527],
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const onSelectZoneRef = useRef(onSelectZone);
  const [mapError, setMapError] = useState(false);
  onSelectZoneRef.current = onSelectZone;

  useEffect(() => {
    if (!mapContainer.current) return;

    let map: L.Map | null = null;
    try {
      map = L.map(mapContainer.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        zoomSnap: 0.5,
        attributionControl: true,
      }).setView([28.625, 77.229], 10.5);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      summaries.forEach((summary) => {
        const position = SAMPLE_LOCATIONS[summary.zone];
        if (!position) return;

        const marker = L.marker(position, {
          keyboard: true,
          riseOnHover: true,
          title: `${summary.zone}: ${summary.risk.toLowerCase()} risk, ${summary.current.length} reports in 48 hours`,
          icon: L.divIcon({
            className: "neighborhood-map-marker-shell",
            html: `<button type="button" class="neighborhood-map-marker risk-${summary.risk.toLowerCase()}" style="--marker-color:${RISK_COLORS[summary.risk]}" aria-label="Open ${summary.zone}: ${summary.risk.toLowerCase()} risk, ${summary.current.length} reports">${summary.current.length}</button>`,
            iconSize: [38, 42],
            iconAnchor: [19, 38],
          }),
        }).addTo(map!);

        marker.on("click", () => onSelectZoneRef.current(summary.zone));
        bounds.extend(position);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
      }
      requestAnimationFrame(() => map?.invalidateSize());
    } catch (error) {
      console.error("OpenStreetMap failed to initialize", error);
      setMapError(true);
    }

    return () => {
      map?.remove();
    };
  }, [summaries]);

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
            <div ref={mapContainer} className="neighborhood-openstreetmap" aria-label="Interactive OpenStreetMap of sample neighborhood locations" />
          ) : (
            <div className="map-fallback" role="status">
              <MapPin size={23} />
              <b>Map tiles couldn’t load</b>
              <span>Choose an area from the location list to view its signal.</span>
            </div>
          )}
          {!mapError && <span className="map-overlay-label"><LocateFixed size={13} /> Community signals · OpenStreetMap</span>}
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

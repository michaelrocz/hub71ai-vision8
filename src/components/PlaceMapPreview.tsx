import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import type { AbuDhabiArea } from '../lib/abuDhabiAreas';
import 'leaflet/dist/leaflet.css';

const makeAreaPin = (name: string) => L.divIcon({
  className: 'place-map-pin',
  html: `<span class="place-map-pin__dot"></span><span class="place-map-pin__label">${name}</span>`,
  iconSize: [170, 38],
  iconAnchor: [12, 30],
});

interface PlaceMapPreviewProps {
  area: AbuDhabiArea;
  className?: string;
  interactive?: boolean;
  showAttribution?: boolean;
  showCaption?: boolean;
}

export default function PlaceMapPreview({ area, className = '', interactive = false, showAttribution = true, showCaption = true }: PlaceMapPreviewProps) {
  return (
    <div className={`place-map-preview ${className}`} aria-label={`Satellite view of ${area.name}`}>
      <MapContainer
        key={area.id}
        center={[area.latitude, area.longitude]}
        zoom={area.zoom}
        zoomControl={false}
        attributionControl={showAttribution}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        keyboard={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <Marker position={[area.latitude, area.longitude]} icon={makeAreaPin(area.name)} interactive={false} />
      </MapContainer>
      {showCaption && <span className="place-map-preview__caption">Satellite imagery · {area.name}</span>}
    </div>
  );
}

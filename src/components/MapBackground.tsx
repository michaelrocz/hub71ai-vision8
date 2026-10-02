import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Premium Pin using Tailwind
const customIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div class="w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-xl border-4 border-white"><div class="w-3 h-3 bg-white rounded-full animate-ping"></div></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export interface MapAction {
  latitude: number;
  longitude: number;
  zoom: number;
}

function MapUpdater({ action }: { action: MapAction | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (action) {
      map.flyTo([action.latitude, action.longitude], action.zoom, {
        duration: 3,
        easeLinearity: 0.2
      });
    }
  }, [action, map]);
  
  return action ? <Marker position={[action.latitude, action.longitude]} icon={customIcon} /> : null;
}

export default function MapBackground({ action }: { action: MapAction | null }) {
  // Center of Abu Dhabi
  const center = { lat: 24.4539, lng: 54.3773 };

  return (
    <div className="absolute inset-0 z-0 bg-sand-100">
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={12} 
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <MapUpdater action={action} />
      </MapContainer>
    </div>
  );
}

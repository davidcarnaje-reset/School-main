import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Target } from 'lucide-react';

// Fix Leaflet's default marker icon path issue in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom component to handle click on map to set position
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to handle recentering map when props change
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], map.getZoom() || 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

const DtrMapPicker = ({ latitude, longitude, radius, onLocationChange, onCurrentLocationClick }) => {
  const latNum = parseFloat(latitude) || 14.9079167;
  const lngNum = parseFloat(longitude) || 121.0331667;
  const radNum = parseInt(radius, 10) || 150;

  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onLocationChange(latLng.lat.toFixed(7), latLng.lng.toFixed(7));
        }
      },
    }),
    [onLocationChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <MapPin size={14} className="text-emerald-600" />
          <span>Interactive Campus Map (Click map or drag pin to set location)</span>
        </div>
        
        <button
          type="button"
          onClick={onCurrentLocationClick}
          className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold transition-all shadow-sm"
        >
          <Target size={14} />
          <span>Pin My Current GPS Location</span>
        </button>
      </div>

      <div className="relative h-[360px] w-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm z-0">
        <MapContainer
          center={[latNum, lngNum]}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapRecenter lat={latNum} lng={lngNum} />
          
          <MapClickHandler
            onLocationSelect={(lat, lng) => {
              onLocationChange(lat.toFixed(7), lng.toFixed(7));
            }}
          />

          {/* DRAGGABLE PIN MARKER */}
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[latNum, lngNum]}
            ref={markerRef}
          />

          {/* VISUAL RADIUS BOUNDARY CIRCLE */}
          <Circle
            center={[latNum, lngNum]}
            radius={radNum}
            pathOptions={{
              color: '#059669',
              fillColor: '#10b981',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: '4, 4'
            }}
          />
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-md z-[1000] text-[10px] font-bold text-slate-700 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600"></span>
            <span>Pinned Location</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500 border-dashed"></span>
            <span>{radNum}m Allowed Radius</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 font-medium italic">
        💡 Tip: Click anywhere on the map or drag the blue pin marker to update the latitude and longitude instantly. The green circle shows the allowed DTR login area.
      </p>
    </div>
  );
};

export default DtrMapPicker;

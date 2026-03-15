import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Maximize2, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fix for default marker icon in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapDisplayProps {
  center: { lat: number; lng: number };
  zoom?: number;
}

const ChangeView: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center[0] !== 0 || center[1] !== 0) {
      map.setView(center, zoom);
      // Ensure map tiles are correctly aligned after container size might have changed
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [center, zoom, map]);
  
  return null;
};

export const MapDisplay: React.FC<MapDisplayProps> = ({ center, zoom = 13 }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const isValidLocation = center.lat !== 0 || center.lng !== 0;

  const mapCenter = useMemo<[number, number]>(() => [
    isValidLocation ? center.lat : 20, 
    isValidLocation ? center.lng : 0
  ], [center.lat, center.lng, isValidLocation]);

  const renderMap = (isFull: boolean) => (
    <MapContainer
      center={mapCenter}
      zoom={isValidLocation ? zoom : 2}
      scrollWheelZoom={true}
      className="h-full w-full z-0"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {isValidLocation && (
        <Marker position={mapCenter}>
          <Popup>
            推测拍摄位置
          </Popup>
        </Marker>
      )}
      <ChangeView center={mapCenter} zoom={isValidLocation ? zoom : 2} />
    </MapContainer>
  );

  return (
    <div className="h-full w-full relative group bg-slate-100">
      <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
        {!isValidLocation && (
          <div className="absolute inset-0 z-[401] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm text-slate-400 gap-3">
            <MapPin className="w-8 h-8 opacity-20" />
            <p className="text-sm font-medium">等待地理位置数据...</p>
          </div>
        )}
        
        <div className="h-full w-full relative z-0">
          {renderMap(false)}
        </div>
        
        {isValidLocation && (
          <button
            onClick={() => setIsFullScreen(true)}
            className="absolute top-4 right-4 z-[400] p-2 bg-white/90 rounded-lg text-slate-900 hover:bg-white transition-all shadow-md opacity-0 group-hover:opacity-100"
            title="全屏查看"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col"
          >
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">地理位置全屏视图</h2>
              </div>
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 relative">
              {renderMap(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

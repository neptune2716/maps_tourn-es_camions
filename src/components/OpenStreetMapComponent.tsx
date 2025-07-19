import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, Route } from '../types';

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OpenStreetMapProps {
  locations: Location[];
  route?: Route;
  className?: string;
}

export default function OpenStreetMapComponent({ 
  locations, 
  route, 
  className = "w-full h-96 rounded-lg" 
}: OpenStreetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Create map instance
    const map = L.map(mapContainer.current).setView([48.8566, 2.3522], 10);

    // Add OpenStreetMap tiles (FREE!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstance.current?.removeLayer(marker);
    });
    markersRef.current = [];

    if (locations.length === 0) return;

    const validLocations = locations.filter(loc => loc.coordinates);
    
    if (validLocations.length === 0) return;

    // Add new markers
    validLocations.forEach((location, index) => {
      if (!location.coordinates || !mapInstance.current) return;

      // Create custom icon
      const iconColor = location.isLocked ? '#dc2626' : '#3b82f6';
      const customIcon = L.divIcon({
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background-color: ${iconColor};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            ${index + 1}
          </div>
        `,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([location.coordinates.latitude, location.coordinates.longitude], {
        icon: customIcon
      }).addTo(mapInstance.current);

      // Add popup
      const popupContent = `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${location.address}</h3>
          <p style="margin: 0; color: #666; font-size: 12px;">
            ${location.coordinates.latitude.toFixed(6)}, ${location.coordinates.longitude.toFixed(6)}
          </p>
          ${location.isLocked ? '<p style="margin: 4px 0 0 0; color: #dc2626; font-size: 11px;">🔒 Position verrouillée</p>' : ''}
        </div>
      `;
      
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (validLocations.length === 1) {
      const coords = validLocations[0].coordinates!;
      mapInstance.current.setView([coords.latitude, coords.longitude], 14);
    } else if (validLocations.length > 1) {
      const group = new L.FeatureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [locations]);

  // Update route when route changes
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing route
    if (routeLayerRef.current) {
      mapInstance.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (!route || route.locations.length < 2) return;

    // Create route line
    const routeCoords: L.LatLngExpression[] = [];
    
    // Add main route points
    route.locations.forEach(location => {
      if (location.coordinates) {
        routeCoords.push([location.coordinates.latitude, location.coordinates.longitude]);
      }
    });

    // Add return to start for loop routes
    if (route.isLoop && route.locations.length > 0 && route.locations[0].coordinates) {
      routeCoords.push([route.locations[0].coordinates.latitude, route.locations[0].coordinates.longitude]);
    }

    if (routeCoords.length > 1) {
      const polyline = L.polyline(routeCoords, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
      }).addTo(mapInstance.current);

      routeLayerRef.current = polyline;

      // Fit map to route
      mapInstance.current.fitBounds(polyline.getBounds().pad(0.1));
    }
  }, [route]);

  return (
    <div className="relative">
      <div ref={mapContainer} className={className} />
      
      {/* Route info overlay */}
      {route && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1000]">
          <h4 className="font-semibold text-gray-900 mb-2">📍 Informations du trajet</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium">{route.totalDistance.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Durée:</span>
              <span className="font-medium">{Math.round(route.totalDuration)} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Véhicule:</span>
              <span className="font-medium capitalize">{route.vehicleType}</span>
            </div>
            {route.isLoop && (
              <div className="text-xs text-blue-600 mt-2">
                🔄 Trajet en boucle
              </div>
            )}
          </div>
        </div>
      )}

      {/* No locations message */}
      {locations.length === 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <p className="text-gray-600 text-center">
              Ajoutez des emplacements pour les voir sur la carte
            </p>
          </div>
        </div>
      )}

      {/* OpenStreetMap attribution */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 px-2 py-1 rounded text-xs text-gray-600">
        🌍 Cartes gratuites OpenStreetMap
      </div>
    </div>
  );
}

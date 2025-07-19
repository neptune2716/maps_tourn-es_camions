import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, Route } from '../types/index.ts';

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
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

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

    if (!route || route.segments.length === 0) return;

    // Create route from segments with real road geometry
    const routeLayers: L.Layer[] = [];
    
    route.segments.forEach((segment, index) => {
      if (segment.polyline && segment.polyline.coordinates) {
        // Convertir les coordonnées GeoJSON en format Leaflet
        const coordinates = segment.polyline.coordinates.map((coord: number[]) => 
          [coord[1], coord[0]] as L.LatLngExpression
        );
        
        if (coordinates.length > 1) {
          const segmentLine = L.polyline(coordinates, {
            color: index === route.segments.length - 1 && route.isLoop ? '#ef4444' : '#3b82f6', // Rouge pour le retour en boucle
            weight: 4,
            opacity: 0.8,
          });
          
          routeLayers.push(segmentLine);
        }
      } else {
        // Fallback : ligne droite si pas de géométrie disponible
        if (segment.from.coordinates && segment.to.coordinates) {
          const straightLine = L.polyline([
            [segment.from.coordinates.latitude, segment.from.coordinates.longitude],
            [segment.to.coordinates.latitude, segment.to.coordinates.longitude]
          ], {
            color: '#94a3b8', // Gris pour indiquer une estimation
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 10' // Ligne pointillée pour les estimations
          });
          
          routeLayers.push(straightLine);
        }
      }
    });

    if (routeLayers.length > 0) {
      // Grouper toutes les couches de route
      const routeGroup = L.layerGroup(routeLayers).addTo(mapInstance.current);
      routeLayerRef.current = routeGroup as any;

      // Adapter la vue pour montrer toute la route
      const allBounds = routeLayers.reduce((bounds, layer) => {
        if (layer instanceof L.Polyline) {
          return bounds ? bounds.extend(layer.getBounds()) : layer.getBounds();
        }
        return bounds;
      }, null as L.LatLngBounds | null);

      if (allBounds) {
        mapInstance.current.fitBounds(allBounds.pad(0.1));
      }
    }
  }, [route]);

  return (
    <div className="relative">
      <div ref={mapContainer} className={className} />
      
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

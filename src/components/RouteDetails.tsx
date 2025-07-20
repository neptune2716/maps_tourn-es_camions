import { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Navigation, 
  TrendingUp, 
  Car, 
  Truck, 
  Settings2,
  ChevronDown,
  ChevronUp,
  Route as RouteIcon,
  Calculator
} from 'lucide-react';
import { Route } from '../types/index.ts';
import { trimAddress } from '../utils/routeUtils.ts';

interface RouteDetailsProps {
  route: Route;
}

interface RouteStats {
  avgSegmentDistance: number;
  avgSegmentDuration: number;
  longestSegment: { distance: number; duration: number; from: string; to: string };
  shortestSegment: { distance: number; duration: number; from: string; to: string };
  avgSpeed: number;
}

export default function RouteDetails({ route }: RouteDetailsProps) {
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [showAllSegments, setShowAllSegments] = useState(false);

  const calculateStats = (): RouteStats => {
    const segments = route.segments;
    if (segments.length === 0) {
      return {
        avgSegmentDistance: 0,
        avgSegmentDuration: 0,
        longestSegment: { distance: 0, duration: 0, from: '', to: '' },
        shortestSegment: { distance: 0, duration: 0, from: '', to: '' },
        avgSpeed: 0
      };
    }

    const totalSegmentDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalSegmentDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
    
    const avgSegmentDistance = totalSegmentDistance / segments.length;
    const avgSegmentDuration = totalSegmentDuration / segments.length;
    
    const longestSeg = segments.reduce((longest, current) => 
      current.distance > longest.distance ? current : longest
    );
    
    const shortestSeg = segments.reduce((shortest, current) => 
      current.distance < shortest.distance ? current : shortest
    );

    const avgSpeed = route.totalDuration > 0 ? (route.totalDistance / (route.totalDuration / 60)) : 0;

    return {
      avgSegmentDistance,
      avgSegmentDuration,
      longestSegment: {
        distance: longestSeg.distance,
        duration: longestSeg.duration,
        from: trimAddress(longestSeg.from.address),
        to: trimAddress(longestSeg.to.address)
      },
      shortestSegment: {
        distance: shortestSeg.distance,
        duration: shortestSeg.duration,
        from: trimAddress(shortestSeg.from.address),
        to: trimAddress(shortestSeg.to.address)
      },
      avgSpeed
    };
  };

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
    return `${Math.round(minutes)} min`;
  };

  const getOptimizationMethodLabel = (method: string): string => {
    switch (method) {
      case 'shortest_distance':
        return 'Distance la plus courte';
      case 'fastest_time':
        return 'Temps le plus rapide';
      case 'balanced':
        return 'Équilibré';
      default:
        return method;
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    return vehicleType === 'car' ? <Car className="h-4 w-4" /> : <Truck className="h-4 w-4" />;
  };

  const stats = calculateStats();
  const visibleSegments = showAllSegments ? route.segments : route.segments.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Main Route Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <RouteIcon className="mr-2 h-5 w-5" />
            Résumé du Trajet
          </h3>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <Navigation className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm font-medium text-blue-900">Distance</span>
            </div>
            <div className="text-xl font-bold text-blue-700">
              {route.totalDistance.toFixed(1)} km
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <Clock className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm font-medium text-green-900">Durée</span>
            </div>
            <div className="text-xl font-bold text-green-700">
              {formatDuration(route.totalDuration)}
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <MapPin className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-sm font-medium text-purple-900">Arrêts</span>
            </div>
            <div className="text-xl font-bold text-purple-700">
              {route.locations.length}
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center mb-1">
              <TrendingUp className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-sm font-medium text-orange-900">Vitesse moy.</span>
            </div>
            <div className="text-xl font-bold text-orange-700">
              {stats.avgSpeed.toFixed(0)} km/h
            </div>
          </div>
        </div>

        {/* Route Configuration */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center">
              {getVehicleIcon(route.vehicleType)}
              <span className="ml-2 text-gray-700">
                <span className="font-medium">Véhicule:</span> {route.vehicleType === 'car' ? 'Voiture' : 'Camion'}
              </span>
            </div>
            <div className="flex items-center">
              <Settings2 className="h-4 w-4 text-gray-600" />
              <span className="ml-2 text-gray-700">
                <span className="font-medium">Méthode:</span> {getOptimizationMethodLabel(route.optimizationMethod)}
              </span>
            </div>
            <div className="flex items-center">
              <Navigation className="h-4 w-4 text-gray-600" />
              <span className="ml-2 text-gray-700">
                <span className="font-medium">Type:</span> {route.isLoop ? 'Boucle' : 'Linéaire'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Statistics */}
      <div className="card">
        <button
          onClick={() => setShowAdvancedStats(!showAdvancedStats)}
          className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center">
            <Calculator className="h-5 w-5 text-gray-600 mr-2" />
            <span className="font-medium text-gray-900">Statistiques Avancées</span>
          </div>
          {showAdvancedStats ? 
            <ChevronUp className="h-5 w-5 text-gray-600" /> : 
            <ChevronDown className="h-5 w-5 text-gray-600" />
          }
        </button>

        {showAdvancedStats && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Moyennes par segment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance moyenne:</span>
                    <span className="font-medium">{stats.avgSegmentDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durée moyenne:</span>
                    <span className="font-medium">{formatDuration(stats.avgSegmentDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Segments totaux:</span>
                    <span className="font-medium">{route.segments.length}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Segments extrêmes</h4>
                <div className="space-y-3">
                  <div className="bg-red-50 p-2 rounded">
                    <div className="text-xs font-medium text-red-900 mb-1">Plus long segment</div>
                    <div className="text-xs text-red-700">
                      {stats.longestSegment.from} → {stats.longestSegment.to}
                    </div>
                    <div className="text-xs text-red-600">
                      {stats.longestSegment.distance.toFixed(1)} km • {formatDuration(stats.longestSegment.duration)}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-xs font-medium text-green-900 mb-1">Plus court segment</div>
                    <div className="text-xs text-green-700">
                      {stats.shortestSegment.from} → {stats.shortestSegment.to}
                    </div>
                    <div className="text-xs text-green-600">
                      {stats.shortestSegment.distance.toFixed(1)} km • {formatDuration(stats.shortestSegment.duration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Segments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Étapes Détaillées
          </h3>
          {route.segments.length > 4 && (
            <button
              onClick={() => setShowAllSegments(!showAllSegments)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              {showAllSegments ? (
                <>
                  Voir moins <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  Voir tout ({route.segments.length}) <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {visibleSegments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {trimAddress(segment.from.address)}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Navigation className="h-3 w-3 mr-1" />
                    {trimAddress(segment.to.address)}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {segment.distance.toFixed(1)} km
                </div>
                <div className="text-xs text-gray-500 flex items-center justify-end">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(segment.duration)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!showAllSegments && route.segments.length > 4 && (
          <div className="text-center mt-3 text-sm text-gray-500">
            ... et {route.segments.length - 4} autres étapes
          </div>
        )}
      </div>
    </div>
  );
}

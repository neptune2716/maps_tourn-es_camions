import { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Navigation, 
  Settings, 
  ArrowLeft,
  FileText,
  Map
} from 'lucide-react';
import { Route } from '../types/index.ts';
import RouteDetails from './RouteDetails.tsx';
import RouteExport from './RouteExport.tsx';
import DrivingDirections from './DrivingDirections.tsx';
import OpenStreetMapComponent from './OpenStreetMapComponent.tsx';

interface RouteResultsProps {
  route: Route;
  onBack: () => void;
  onModifyRoute: () => void;
}

type TabType = 'overview' | 'details' | 'directions' | 'export';

export default function RouteResults({ route, onBack, onModifyRoute }: RouteResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Aperçu', icon: BarChart3 },
    { id: 'details' as TabType, label: 'Détails', icon: FileText },
    { id: 'directions' as TabType, label: 'Instructions', icon: Navigation },
    { id: 'export' as TabType, label: 'Export', icon: Download },
  ];

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
    return `${Math.round(minutes)} min`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
        
        {/* Header */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="btn-outline flex items-center px-3 py-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Résultats du Trajet
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {route.locations.length} arrêts • {route.totalDistance.toFixed(1)} km • {formatDuration(route.totalDuration)}
                </p>
              </div>
            </div>
            <button
              onClick={onModifyRoute}
              className="btn-secondary flex items-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              Modifier
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-700">{route.totalDistance.toFixed(1)} km</div>
              <div className="text-sm text-blue-600">Distance totale</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-green-700">{formatDuration(route.totalDuration)}</div>
              <div className="text-sm text-green-600">Durée estimée</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-700">{route.locations.length}</div>
              <div className="text-sm text-purple-600">Arrêts</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-orange-700">
                {route.totalDuration > 0 ? (route.totalDistance / (route.totalDuration / 60)).toFixed(0) : 0} km/h
              </div>
              <div className="text-sm text-orange-600">Vitesse moyenne</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card mb-4">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <IconComponent className="mr-2 h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Map */}
              <div className="xl:col-span-2">
                <div className="card">
                  <div className="flex items-center mb-4">
                    <Map className="mr-2 h-5 w-5" />
                    <h3 className="text-lg font-semibold text-gray-900">Carte du Trajet</h3>
                  </div>
                  <OpenStreetMapComponent 
                    locations={route.locations}
                    route={route}
                    className="h-[400px] sm:h-[500px] rounded-lg"
                  />
                </div>
              </div>

              {/* Quick Actions & Summary */}
              <div className="space-y-4">
                <RouteExport route={route} />
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <RouteDetails route={route} />
          )}

          {activeTab === 'directions' && (
            <DrivingDirections route={route} />
          )}

          {activeTab === 'export' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RouteExport route={route} />
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu des Données</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Type de véhicule:</span>
                      <span className="capitalize">{route.vehicleType === 'car' ? 'Voiture' : 'Camion'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Méthode d'optimisation:</span>
                      <span>
                        {route.optimizationMethod === 'shortest_distance' ? 'Distance' :
                         route.optimizationMethod === 'fastest_time' ? 'Temps' :
                         'Équilibré'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Trajet en boucle:</span>
                      <span>{route.isLoop ? 'Oui' : 'Non'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Nombre de segments:</span>
                      <span>{route.segments.length}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Date de génération:</span>
                      <span>{new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

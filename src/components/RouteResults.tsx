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
    <div className="h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      <div className="h-full p-2 sm:p-4">
        {/* Main Grid Layout: 4 columns x 3 rows - more compact */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-auto md:grid-rows-3 gap-2 sm:gap-4 h-full">
          
          {/* Header - Spans all columns, Row 1 */}
          <div className="md:col-span-4 md:row-span-1">
            <div className="card h-full flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-1">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onBack}
                    className="btn-outline flex items-center px-3 py-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </button>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                      Résultats du Trajet
                    </h1>
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
                <div className="bg-blue-50 p-2 rounded text-center">
                  <div className="text-sm font-bold text-blue-700">{route.totalDistance.toFixed(1)} km</div>
                  <div className="text-xs text-blue-600">Distance totale</div>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <div className="text-sm font-bold text-green-700">{formatDuration(route.totalDuration)}</div>
                  <div className="text-xs text-green-600">Durée estimée</div>
                </div>
                <div className="bg-purple-50 p-2 rounded text-center">
                  <div className="text-sm font-bold text-purple-700">{route.locations.length}</div>
                  <div className="text-xs text-purple-600">Arrêts</div>
                </div>
                <div className="bg-orange-50 p-2 rounded text-center">
                  <div className="text-sm font-bold text-orange-700">
                    {route.totalDuration > 0 ? (route.totalDistance / (route.totalDuration / 60)).toFixed(0) : 0} km/h
                  </div>
                  <div className="text-xs text-orange-600">Vitesse moyenne</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Spans all columns, Row 2 */}
          <div className="md:col-span-4">
            <div className="card py-2">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-6 overflow-x-auto">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap
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
          </div>

          {/* Tab Content - Different layouts based on active tab */}
          {activeTab === 'overview' && (
            <>
              {/* Map - Columns 1-3, Rows 3-4 */}
              <div className="md:col-span-3 md:row-span-2">
                <div className="card h-full flex flex-col">
                  <div className="flex items-center mb-3 flex-shrink-0">
                    <Map className="mr-2 h-5 w-5" />
                    <h3 className="text-base font-semibold text-gray-900">Carte du Trajet</h3>
                  </div>
                  <div className="flex-1 min-h-0">
                    <OpenStreetMapComponent 
                      locations={route.locations}
                      route={route}
                      className="h-full w-full rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Export Panel - Column 4, Rows 3-4 */}
              <div className="md:col-span-1 md:row-span-2">
                <div className="card h-full">
                  <RouteExport route={route} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'details' && (
            <div className="md:col-span-4 md:row-span-2">
              <div className="card h-full flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <RouteDetails route={route} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'directions' && (
            <div className="md:col-span-4 md:row-span-2">
              <div className="card h-full flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <DrivingDirections route={route} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <>
              {/* Export Component - Columns 1-2, Rows 3-4 */}
              <div className="md:col-span-2 md:row-span-2">
                <div className="card h-full">
                  <RouteExport route={route} />
                </div>
              </div>

              {/* Data Overview - Columns 3-4, Rows 3-4 */}
              <div className="md:col-span-2 md:row-span-2">
                <div className="card h-full flex flex-col">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex-shrink-0">Aperçu des Données</h3>
                  <div className="bg-gray-50 p-4 rounded-lg flex-1">
                    <div className="text-sm space-y-3">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

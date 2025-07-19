import { useState } from 'react';
import { Upload, MapPin, Play, AlertCircle, AlertTriangle, Settings2, Car, Truck, Clock, Fuel, Navigation } from 'lucide-react';
import { Location, VehicleType, OptimizationMethod, Route } from '../types/index.ts';
import { freeRoutingService } from '../services/freeRoutingService.ts';
import { trimAddress } from '../utils/routeUtils.ts';
import OpenStreetMapComponent from './OpenStreetMapComponent.tsx';
import AddressAutocomplete from './AddressAutocomplete.tsx';
import FileUpload from './FileUpload.tsx';
import LocationList from './LocationList.tsx';
import { AddressSuggestion } from '../hooks/useAddressSearch.ts';

export default function RouteOptimizer() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [optimizationMethod, setOptimizationMethod] = useState<OptimizationMethod>('balanced');
  const [isLoop, setIsLoop] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [route, setRoute] = useState<Route | undefined>();
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);

  const addLocation = () => {
    if (newAddress.trim()) {
      const newLocation: Location = {
        id: Math.random().toString(36).substr(2, 9),
        address: newAddress.trim(),
        order: locations.length,
      };

      setLocations([...locations, newLocation]);
      setNewAddress('');
    }
  };

  const addLocationFromSuggestion = (suggestion: AddressSuggestion) => {
    const newLocation: Location = {
      id: Math.random().toString(36).substr(2, 9),
      address: suggestion.display_name,
      coordinates: {
        latitude: parseFloat(suggestion.lat),
        longitude: parseFloat(suggestion.lon),
      },
      order: locations.length,
    };

    setLocations([...locations, newLocation]);
    setNewAddress('');
    
    // Effacer la route existante car les emplacements ont changé
    setRoute(undefined);
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
    // Clear route if locations change
    setRoute(undefined);
  };

  const toggleLockLocation = (id: string) => {
    setLocations(locations.map(loc => 
      loc.id === id ? { ...loc, isLocked: !loc.isLocked } : loc
    ));
    // Clear route when locks change
    setRoute(undefined);
  };

  const handleLocationUpdate = (newLocations: Location[]) => {
    setLocations(newLocations);
    setRoute(undefined);
  };

  const handleLocationEdit = (id: string, newAddress: string, coordinates?: { latitude: number; longitude: number }) => {
    setLocations(locations.map(loc =>
      loc.id === id ? { 
        ...loc, 
        address: newAddress, 
        coordinates: coordinates || undefined // Garder les coordonnées si fournies, sinon les supprimer
      } : loc
    ));
    setRoute(undefined);
  };

  const handleFileUpload = (uploadedLocations: Location[], replaceExisting: boolean) => {
    if (replaceExisting) {
      setLocations(uploadedLocations);
    } else {
      setLocations(prev => [...prev, ...uploadedLocations]);
    }
    setRoute(undefined);
    setShowFileUpload(false);
  };

  const optimizeRoute = async () => {
    if (locations.length < 2) {
      setCalculationError('Au moins 2 emplacements sont requis');
      return;
    }

    // Vérifier que tous les emplacements ont des coordonnées
    const ungeocoded = locations.filter(loc => !loc.coordinates);
    if (ungeocoded.length > 0) {
      setCalculationError(
        `${ungeocoded.length} adresse(s) ne sont pas géocodées. Veuillez résoudre ces adresses avant de calculer l'itinéraire :\n` +
        ungeocoded.map(loc => `• ${loc.address}`).join('\n')
      );
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const response = await freeRoutingService.calculateRoute({
        locations,
        vehicleType,
        optimizationMethod,
        isLoop,
      });

      setRoute(response.route);
      
      // Mettre à jour les emplacements avec l'ordre optimisé
      setLocations(response.route.locations);
      
      console.log('Trajet optimisé avec succès:', response);
    } catch (error) {
      console.error('Échec de l\'optimisation de trajet:', error);
      setCalculationError(error instanceof Error ? error.message : 'Impossible d\'optimiser le trajet');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Emplacements and Résultats */}
          <div className="col-span-3 space-y-4">
            {/* Emplacements Container */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Emplacements
              </h2>
              
              <div className="flex gap-2 mb-4">
                <AddressAutocomplete
                  value={newAddress}
                  onChange={setNewAddress}
                  onSelect={addLocationFromSuggestion}
                  placeholder="Rechercher une adresse..."
                  className="flex-1"
                />
                <button
                  onClick={addLocation}
                  className="btn-primary px-4"
                  disabled={!newAddress.trim()}
                >
                  +
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-2.5 max-h-80 overflow-y-auto mb-2.5">
                <LocationList
                  locations={locations}
                  onLocationUpdate={handleLocationUpdate}
                  onLocationEdit={handleLocationEdit}
                  onLocationDelete={removeLocation}
                  onLocationLock={toggleLockLocation}
                />
              </div>

              <div className="space-y-2.5">
                <button 
                  onClick={() => setShowFileUpload(true)}
                  className="btn-secondary w-full text-sm flex items-center justify-center"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importer fichier
                </button>

                {/* Optimize Button */}
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={optimizeRoute}
                    disabled={
                      locations.length < 2 || 
                      isCalculating || 
                      locations.some(loc => !loc.coordinates)
                    }
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCalculating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Calcul en cours...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Optimiser le Trajet
                      </>
                    )}
                  </button>

                  {locations.some(loc => !loc.coordinates) && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                      ⚠️ Certaines adresses doivent être géocodées
                    </div>
                  )}

                  {calculationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                          <div className="font-medium mb-1">Erreur</div>
                          <div className="whitespace-pre-line">{calculationError}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Résultats Container */}
            {route && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Fuel className="mr-2 h-5 w-5" />
                  Résultats
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-900">Distance</div>
                      <div className="text-blue-700 text-lg font-semibold">{route.totalDistance.toFixed(1)} km</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-green-900">Durée</div>
                      <div className="text-green-700 text-lg font-semibold">
                        {route.totalDuration >= 60 
                          ? `${Math.floor(route.totalDuration / 60)}h${(Math.round(route.totalDuration) % 60).toString().padStart(2, '0')}`
                          : `${Math.round(route.totalDuration)} min`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 grid grid-cols-2 gap-x-3 gap-y-1">
                      <div className="flex items-center">
                        {route.vehicleType === 'car' ? <Car className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                        <span className="font-medium">Véhicule:</span> 
                        <span className="ml-1 capitalize">{route.vehicleType === 'car' ? 'Voiture' : 'Camion'}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="font-medium">Arrêts:</span> 
                        <span className="ml-1">{route.locations.length}</span>
                      </div>
                      <div className="flex items-center">
                        <Settings2 className="h-3 w-3 mr-1" />
                        <span className="font-medium">Méthode:</span> 
                        <span className="ml-1">
                          {route.optimizationMethod === 'shortest_distance' ? 'Distance' :
                           route.optimizationMethod === 'fastest_time' ? 'Temps' :
                           'Équilibré'}
                        </span>
                      </div>
                      {route.isLoop && (
                        <div className="flex items-center">
                          <Navigation className="h-3 w-3 mr-1" />
                          <span className="font-medium">Trajet en boucle</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-9">
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Middle Panel - Paramètres (4/12 of remaining 9 columns) */}
              <div className="col-span-4 space-y-4">
                <div className="card h-fit">
                  <div className="flex items-center mb-4">
                    <Settings2 className="mr-2 h-5 w-5" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Paramètres de Route
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {/* Vehicle Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Type de Véhicule
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => setVehicleType('car')}
                          className={`
                            p-3.5 rounded-lg border-2 text-left transition-all duration-200
                            ${vehicleType === 'car' 
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center mb-1">
                            <Car className={`h-4 w-4 mr-2 ${vehicleType === 'car' ? 'text-blue-600' : 'text-gray-600'}`} />
                            <span className={`font-medium text-sm ${vehicleType === 'car' ? 'text-blue-900' : 'text-gray-900'}`}>
                              Voiture
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">Véhicule léger, 80 km/h</p>
                        </button>
                        
                        <button
                          onClick={() => setVehicleType('truck')}
                          className={`
                            p-3 rounded-lg border-2 text-left transition-all duration-200
                            ${vehicleType === 'truck' 
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center mb-1">
                            <Truck className={`h-4 w-4 mr-2 ${vehicleType === 'truck' ? 'text-blue-600' : 'text-gray-600'}`} />
                            <span className={`font-medium text-sm ${vehicleType === 'truck' ? 'text-blue-900' : 'text-gray-900'}`}>
                              Camion
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">Poids lourd, 60 km/h</p>
                        </button>
                      </div>
                    </div>

                    {/* Optimization Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Méthode d'Optimisation
                      </label>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => setOptimizationMethod('shortest_distance')}
                          className={`
                            w-full p-3 rounded-lg border text-left transition-all duration-200
                            ${optimizationMethod === 'shortest_distance' 
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <Navigation className={`h-4 w-4 mr-2 ${optimizationMethod === 'shortest_distance' ? 'text-blue-600' : 'text-green-600'}`} />
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${optimizationMethod === 'shortest_distance' ? 'text-blue-900' : 'text-gray-900'}`}>
                                Distance la plus courte
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                Minimise la distance totale
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setOptimizationMethod('fastest_time')}
                          className={`
                            w-full p-3 rounded-lg border text-left transition-all duration-200
                            ${optimizationMethod === 'fastest_time' 
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <Clock className={`h-4 w-4 mr-2 ${optimizationMethod === 'fastest_time' ? 'text-blue-600' : 'text-blue-600'}`} />
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${optimizationMethod === 'fastest_time' ? 'text-blue-900' : 'text-gray-900'}`}>
                                Temps le plus rapide
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                Minimise le temps de trajet
                              </div>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setOptimizationMethod('balanced')}
                          className={`
                            w-full p-3 rounded-lg border text-left transition-all duration-200
                            ${optimizationMethod === 'balanced' 
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <Fuel className={`h-4 w-4 mr-2 ${optimizationMethod === 'balanced' ? 'text-blue-600' : 'text-purple-600'}`} />
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${optimizationMethod === 'balanced' ? 'text-blue-900' : 'text-gray-900'}`}>
                                Équilibré
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                Distance et temps optimisés
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Loop Option */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-2">
                          <Navigation className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">Trajet en boucle</div>
                          <div className="text-xs text-gray-600">Retourner au point de départ</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLoop}
                          onChange={(e) => setIsLoop(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Map (8/12 of remaining 9 columns) */}
              <div className="col-span-8">
                <div className="card relative">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Carte
                    </h2>
                  </div>
                  
                  {/* Map notifications - positioned to avoid zoom controls */}
                  {locations.filter(loc => !loc.coordinates).length > 0 && (
                    <div className="map-notification bg-amber-100 border border-amber-300 rounded-lg p-3 shadow-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                          <div className="font-medium mb-1">
                            {locations.filter(loc => !loc.coordinates).length} adresse(s) non localisée(s)
                          </div>
                          <div className="text-xs">
                            Ces emplacements n'apparaissent pas sur la carte
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <OpenStreetMapComponent 
                    locations={locations}
                    route={route}
                    className="h-[500px] rounded-lg"
                  />
                </div>
              </div>

              {/* Wide Route Details Section - Perfectly aligned with Résultats */}
              {route && (
                <div className="col-span-12">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du Trajet</h3>
                    <div className="grid grid-cols-3 gap-3" style={{ height: '150px', overflowY: 'auto' }}>
                      {route.segments.map((segment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-xs text-gray-900 truncate">
                                {trimAddress(segment.from.address)}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                → {trimAddress(segment.to.address)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-xs font-medium text-gray-900">
                              {segment.distance.toFixed(1)} km
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round(segment.duration)} min
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onLocationsLoaded={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
          existingLocationsCount={locations.length}
        />
      )}
    </div>
  );
}

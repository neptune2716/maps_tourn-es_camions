import { useState } from 'react';
import { Upload, MapPin, Play, AlertCircle, AlertTriangle } from 'lucide-react';
import { Location, VehicleType, OptimizationMethod, Route } from '../types/index.ts';
import { freeRoutingService } from '../services/freeRoutingService.ts';
import OpenStreetMapComponent from './OpenStreetMapComponent.tsx';
import AddressAutocomplete from './AddressAutocomplete.tsx';
import FileUpload from './FileUpload.tsx';
import LocationList from './LocationList.tsx';
import RouteSettings from './RouteSettings.tsx';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Optimiseur de Trajets
          </h1>
          <p className="text-gray-600">
            Ajoutez vos emplacements et personnalisez les paramètres pour trouver le trajet optimal
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Location Input (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
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

              <div className="border border-gray-200 rounded-lg p-3 max-h-80 overflow-y-auto mb-4">
                <LocationList
                  locations={locations}
                  onLocationUpdate={handleLocationUpdate}
                  onLocationEdit={handleLocationEdit}
                  onLocationDelete={removeLocation}
                  onLocationLock={toggleLockLocation}
                />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setShowFileUpload(true)}
                  className="btn-secondary w-full text-sm flex items-center justify-center"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importer fichier
                </button>

                {/* Optimize Button - Now inside the location box */}
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
          </div>

          {/* Right Panel - Map and Results (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="card relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Carte du Trajet
                </h2>
                {route && (
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {route.totalDistance.toFixed(1)} km • {Math.round(route.totalDuration)} min
                  </div>
                )}
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

            {/* Settings and Quick Results */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Settings */}
              <div className="space-y-4">
                <RouteSettings
                  vehicleType={vehicleType}
                  optimizationMethod={optimizationMethod}
                  isLoop={isLoop}
                  onVehicleTypeChange={setVehicleType}
                  onOptimizationMethodChange={setOptimizationMethod}
                  onLoopChange={setIsLoop}
                />
              </div>

              {/* Quick Results Display */}
              {route && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Résultats</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-medium text-blue-900">Distance</div>
                        <div className="text-blue-700">{route.totalDistance.toFixed(1)} km</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="font-medium text-green-900">Durée</div>
                        <div className="text-green-700">{Math.round(route.totalDuration)} min</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>🚗 Véhicule: <span className="capitalize">{route.vehicleType}</span></div>
                      <div>⚡ Méthode: <span className="capitalize">{route.optimizationMethod.replace('_', ' ')}</span></div>
                      <div>📍 Arrêts: {route.locations.length}</div>
                      {route.isLoop && <div>🔄 Trajet en boucle</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Route Breakdown */}
            {route && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails du Trajet</h3>
                <div className="space-y-2">
                  {route.segments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {segment.from.address}
                          </div>
                          <div className="text-xs text-gray-500">
                            → {segment.to.address}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
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
            )}
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

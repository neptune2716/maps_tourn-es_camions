import { useState } from 'react';
import { Upload, MapPin, Play, AlertCircle } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Optimiseur de Trajets
        </h1>
        <p className="text-gray-600">
          Ajoutez vos emplacements et personnalisez les paramètres pour trouver le trajet optimal
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Input and Settings */}
        <div className="space-y-6">
          {/* Location Input */}
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
                placeholder="Rechercher une adresse (ex: Tour Eiffel, Paris)..."
                className="flex-1"
              />
              <button
                onClick={addLocation}
                className="btn-primary px-6"
                disabled={!newAddress.trim()}
              >
                Ajouter
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 min-h-[200px]">
              <LocationList
                locations={locations}
                onLocationUpdate={handleLocationUpdate}
                onLocationEdit={handleLocationEdit}
                onLocationDelete={removeLocation}
                onLocationLock={toggleLockLocation}
              />
            </div>

            <div className="mt-4">
              <button 
                onClick={() => setShowFileUpload(true)}
                className="btn-secondary w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer un fichier (CSV, Excel, JSON)
              </button>
            </div>
          </div>

          {/* Settings */}
          <RouteSettings
            vehicleType={vehicleType}
            optimizationMethod={optimizationMethod}
            isLoop={isLoop}
            onVehicleTypeChange={setVehicleType}
            onOptimizationMethodChange={setOptimizationMethod}
            onLoopChange={setIsLoop}
          />

          {/* Optimize Button & Results */}
          <div className="card">
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
                  Calculating Route...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Optimize Route
                  {locations.some(loc => !loc.coordinates) && (
                    <span className="ml-2 text-xs opacity-75">
                      (Résolvez d'abord les adresses)
                    </span>
                  )}
                </>
              )}
            </button>

            {calculationError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <div className="font-medium mb-1">Impossible de calculer l'itinéraire</div>
                    <div className="whitespace-pre-line">{calculationError}</div>
                  </div>
                </div>
              </div>
            )}

            {route && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Route Optimized!</h3>
                <div className="space-y-1 text-sm text-green-800">
                  <div>Distance: {route.totalDistance.toFixed(1)} km</div>
                  <div>Duration: {Math.round(route.totalDuration)} minutes</div>
                  <div>Locations: {route.locations.length}</div>
                  <div>Vehicle: <span className="capitalize">{route.vehicleType}</span></div>
                  <div>Method: <span className="capitalize">{route.optimizationMethod.replace('_', ' ')}</span></div>
                  {route.isLoop && <div>🔄 Round trip route</div>}
                </div>
                
                {/* Detailed route breakdown */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-green-900 hover:text-green-700">
                    Show detailed breakdown
                  </summary>
                  <div className="mt-2 space-y-1 text-xs">
                    {route.segments.map((segment, index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b border-green-200 last:border-b-0">
                        <span className="truncate mr-2">
                          {segment.from.address} → {segment.to.address}
                        </span>
                        <span className="text-green-700 whitespace-nowrap">
                          {segment.distance.toFixed(1)}km • {Math.round(segment.duration)}min
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Carte du Trajet
          </h2>
          <OpenStreetMapComponent 
            locations={locations}
            route={route}
            className="h-96 rounded-lg"
          />
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

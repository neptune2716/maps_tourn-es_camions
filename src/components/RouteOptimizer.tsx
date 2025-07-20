import { useState, useEffect } from 'react';
import { Upload, MapPin, AlertCircle, Settings2, Fuel, Navigation, FileText, Map, Car, Clock, X } from 'lucide-react';
import { Location, VehicleType, OptimizationMethod, Route } from '../types/index.ts';
import { freeRoutingService } from '../services/freeRoutingService.ts';
import { trimAddress } from '../utils/routeUtils.ts';
import { getUserPreferences, saveUserPreferences } from '../utils/cacheManager.ts';
import LazyMap from './LazyMap.tsx';
import AddressAutocomplete from './AddressAutocomplete.tsx';
import LazyFileUpload from './LazyFileUpload.tsx';
import LocationList from './LocationList.tsx';
import RouteResults from './RouteResults.tsx';
import RouteSettings from './RouteSettings.tsx';
import RouteExport from './RouteExport.tsx';
import { useNotifications, NotificationContainer } from './Notification.tsx';
import { StepProgress } from './Progress.tsx';
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
  const [calculationStep, setCalculationStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);
  
  // Contrôleur d'abandon pour annuler les calculs
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Notifications system
  const { notifications, addNotification, removeNotification } = useNotifications();
  
  // Charger les préférences utilisateur au démarrage
  useEffect(() => {
    const savedPreferences = getUserPreferences();
    if (savedPreferences) {
      setVehicleType(savedPreferences.vehicleType);
      setOptimizationMethod(savedPreferences.optimizationMethod);
      setIsLoop(savedPreferences.isLoop);
      console.log('📖 Préférences utilisateur restaurées');
    }
  }, []);

  // Sauvegarder les préférences quand elles changent
  useEffect(() => {
    const preferences = {
      vehicleType,
      optimizationMethod,
      isLoop,
      autoSaveLocations: true
    };
    saveUserPreferences(preferences);
  }, [vehicleType, optimizationMethod, isLoop]);
  
  const calculationSteps = [
    'Validation des adresses',
    'Calcul des distances',
    'Optimisation du trajet',
    'Génération de la carte'
  ];

  const addLocation = () => {
    if (newAddress.trim()) {
      const newLocation: Location = {
        id: Math.random().toString(36).substr(2, 9),
        address: newAddress.trim(),
        order: locations.length,
      };

      setLocations([...locations, newLocation]);
      setNewAddress('');
      
      addNotification({
        type: 'info',
        title: 'Emplacement ajouté',
        message: `"${newLocation.address}" a été ajouté à la liste.`,
        autoClose: true,
        autoCloseDuration: 3000
      });
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
      addNotification({
        type: 'success',
        title: 'Fichier importé',
        message: `${uploadedLocations.length} emplacement(s) importé(s) avec succès.`,
        autoClose: true
      });
    } else {
      setLocations(prev => [...prev, ...uploadedLocations]);
      addNotification({
        type: 'success', 
        title: 'Emplacements ajoutés',
        message: `${uploadedLocations.length} emplacement(s) ajouté(s) à la liste existante.`,
        autoClose: true
      });
    }
    setRoute(undefined);
    setShowFileUpload(false);
  };

  const optimizeRoute = async () => {
    if (locations.length < 2) {
      setCalculationError('Au moins 2 emplacements sont requis');
      addNotification({
        type: 'warning',
        title: 'Emplacements insuffisants',
        message: 'Ajoutez au moins 2 emplacements pour calculer un trajet.',
        autoClose: true
      });
      return;
    }

    // Vérifier que tous les emplacements ont des coordonnées
    const ungeocoded = locations.filter(loc => !loc.coordinates);
    if (ungeocoded.length > 0) {
      const errorMessage = `${ungeocoded.length} adresse(s) ne sont pas géocodées. Veuillez résoudre ces adresses avant de calculer l'itinéraire :\n` +
        ungeocoded.map(loc => `• ${loc.address}`).join('\n');
      
      setCalculationError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Adresses non géocodées',
        message: `${ungeocoded.length} adresse(s) doivent être résolues avant le calcul.`,
        autoClose: true
      });
      return;
    }

    // Figer les paramètres au moment du lancement du calcul
    const currentParams = {
      vehicleType,
      optimizationMethod,
      isLoop,
      locations: [...locations] // Copie pour éviter les mutations
    };

    // Créer un contrôleur d'abandon
    const controller = new AbortController();
    setAbortController(controller);

    setIsCalculating(true);
    setCalculationError(null);
    setCalculationStep(0);

    try {
      // Fonction helper pour les timeouts annulables
      const abortableTimeout = (ms: number) => {
        return new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => resolve(), ms);
          
          // Écouter l'événement d'annulation
          controller.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Calcul annulé par l\'utilisateur'));
          });
        });
      };

      // Étape 1: Validation
      setCalculationStep(0);
      await abortableTimeout(500);
      
      // Étape 2: Calcul des distances
      setCalculationStep(1);
      await abortableTimeout(800);
      
      // Étape 3: Optimisation
      setCalculationStep(2);
      await abortableTimeout(200);

      // Utiliser les paramètres figés pour le calcul
      const response = await freeRoutingService.calculateRoute({
        locations: currentParams.locations,
        vehicleType: currentParams.vehicleType,
        optimizationMethod: currentParams.optimizationMethod,
        isLoop: currentParams.isLoop,
      });
      
      // Vérifier une dernière fois avant de finaliser
      if (controller.signal.aborted) {
        throw new Error('Calcul annulé par l\'utilisateur');
      }
      
      // Étape 4: Génération de la carte
      setCalculationStep(3);
      await abortableTimeout(300);

      setRoute(response.route);
      
      // Mettre à jour les emplacements avec l'ordre optimisé
      setLocations(response.route.locations);
      
      // Notification de succès
      addNotification({
        type: 'success',
        title: 'Trajet optimisé',
        message: `Trajet calculé avec succès ! Distance: ${response.route.totalDistance.toFixed(1)} km, Durée: ${Math.round(response.route.totalDuration)} min`,
        autoClose: true,
        autoCloseDuration: 4000
      });
      
      console.log('Trajet optimisé avec succès:', response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('annulé')) {
        addNotification({
          type: 'info',
          title: 'Calcul annulé',
          message: 'Le calcul du trajet a été annulé.',
          autoClose: true
        });
      } else {
        console.error('Échec de l\'optimisation de trajet:', error);
        const errorMessage = error instanceof Error ? error.message : 'Impossible d\'optimiser le trajet';
        
        setCalculationError(errorMessage);
        addNotification({
          type: 'error',
          title: 'Erreur de calcul',
          message: 'Impossible de calculer le trajet. Vérifiez votre connexion et réessayez.',
          autoClose: true,
          autoCloseDuration: 6000
        });
      }
    } finally {
      setIsCalculating(false);
      setCalculationStep(0);
      setAbortController(null);
    }
  };

  const cancelCalculation = () => {
    if (abortController) {
      abortController.abort();
      
      // Arrêter immédiatement tous les états
      setIsCalculating(false);
      setCalculationStep(0);
      setAbortController(null);
      
      // Ne pas ajouter de notification ici, elle sera gérée dans le catch
    }
  };

  // Si on affiche les résultats, rendre la page de résultats
  if (showResults && route) {
    return (
      <RouteResults
        route={route}
        onBack={() => setShowResults(false)}
        onModifyRoute={() => {
          setShowResults(false);
          setRoute(undefined);
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-gray-50 lg:overflow-hidden">
      <div className="h-full p-3 sm:p-4 lg:p-4">
        {/* Mobile-first responsive layout: stacked mobile, grid desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 lg:grid-rows-4 gap-3 sm:gap-4 lg:gap-4 lg:h-full">
          {/* Emplacements - Mobile: full width first, Desktop: Column 1, Rows 1-3 */}
          <div className="order-1 lg:col-span-1 lg:row-span-3 flex flex-col">
            <div className="card flex-1 flex flex-col min-h-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center flex-shrink-0">
                <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Emplacements
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4 flex-shrink-0">
                <AddressAutocomplete
                  value={newAddress}
                  onChange={setNewAddress}
                  onSelect={addLocationFromSuggestion}
                  placeholder="Rechercher une adresse..."
                  className="flex-1"
                />
                <button
                  onClick={addLocation}
                  className="btn-primary px-4 py-3 sm:py-2.5 touch-manipulation text-base sm:text-sm"
                  disabled={!newAddress.trim()}
                >
                  Ajouter
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-2.5 flex-1 overflow-y-auto mb-2.5 min-h-0 max-h-64 sm:max-h-none">
                <LocationList
                  locations={locations}
                  onLocationUpdate={handleLocationUpdate}
                  onLocationEdit={handleLocationEdit}
                  onLocationDelete={removeLocation}
                  onLocationLock={toggleLockLocation}
                />
              </div>

              <div className="space-y-2 sm:space-y-2.5 flex-shrink-0">
                <button 
                  onClick={() => setShowFileUpload(true)}
                  className="btn-secondary w-full text-sm sm:text-sm flex items-center justify-center touch-manipulation py-3 sm:py-2.5"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importer fichier
                </button>

                {/* Optimize Button */}
                <div className="pt-2 sm:pt-3 border-t border-gray-200">
                  <button
                    onClick={isCalculating ? cancelCalculation : optimizeRoute}
                    disabled={
                      (!isCalculating && locations.length < 2) || 
                      (!isCalculating && locations.some(loc => !loc.coordinates))
                    }
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation py-3 sm:py-2.5 text-base sm:text-sm"
                  >
                    {isCalculating ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Annuler le calcul
                      </>
                    ) : (
                      <>
                        <Navigation className="mr-2 h-4 w-4" />
                        Optimiser le trajet
                      </>
                    )}
                  </button>

                  {/* Progress indicator during calculation */}
                  {isCalculating && (
                    <div className="mt-2">
                      <StepProgress 
                        steps={calculationSteps}
                        currentStep={calculationStep}
                        showLoadingDots={true}
                      />
                    </div>
                  )}

                  {locations.some(loc => !loc.coordinates) && (
                    <div className="mt-2">
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ {locations.filter(loc => !loc.coordinates).length} adresse(s) doivent être géocodées
                      </div>
                    </div>
                  )}

                  {calculationError && (
                    <div className="mt-2">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-red-800">
                            <div className="font-medium mb-1">Erreur</div>
                            <div className="whitespace-pre-line">{calculationError}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Paramètres - Mobile: second, Desktop: Column 2, Rows 1-3 */}
          <div className="order-2 lg:col-span-1 lg:row-span-3">
            <div className="card h-full flex flex-col">
              <div className="flex items-center mb-3 sm:mb-4 flex-shrink-0">
                <Settings2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Paramètres</h2>
              </div>

              <div className="space-y-3 sm:space-y-3 flex-1">
                <RouteSettings
                  vehicleType={vehicleType}
                  onVehicleTypeChange={setVehicleType}
                  optimizationMethod={optimizationMethod}
                  onOptimizationMethodChange={setOptimizationMethod}
                  isLoop={isLoop}
                  onLoopChange={setIsLoop}
                  disabled={isCalculating}
                />
              </div>
            </div>
          </div>

          {/* Map - Mobile: third (prominent), Desktop: Columns 3-4, Rows 1-3 */}
          <div className="order-3 lg:col-span-2 lg:row-span-3">
            <div className="card h-full flex flex-col">
              <div className="flex items-center mb-3 sm:mb-4 flex-shrink-0">
                <Map className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Carte</h2>
              </div>
              
              {locations.filter(loc => !loc.coordinates).length > 0 && (
                <div className="mb-2 flex-shrink-0">
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ {locations.filter(loc => !loc.coordinates).length} adresse(s) non géocodée(s)
                  </div>
                </div>
              )}
              
              <div className="flex-1 min-h-0 h-64 sm:h-80 lg:flex-1 lg:h-auto">
                <LazyMap
                  locations={locations}
                  route={route}
                />
              </div>
            </div>
          </div>

          {/* Résultats - Mobile: fourth order, Desktop: Column 1, Row 4 */}
          {route && (
            <div className="order-4 lg:col-span-1 lg:row-span-1">
              <div className="card h-full flex flex-col">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center">
                    <Fuel className="mr-2 h-4 w-4" />
                    Résultats
                  </h2>
                  <button
                    onClick={() => setShowExportPopup(true)}
                    className="btn-primary flex items-center text-xs px-3 py-2 sm:px-2 sm:py-1 touch-manipulation"
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                </div>
                
                <div className="space-y-2 flex-1">
                  {/* Main metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs font-medium text-blue-900">Distance</div>
                      <div className="text-sm sm:text-sm font-bold text-blue-700">{route.totalDistance.toFixed(1)} km</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-xs font-medium text-green-900">Durée</div>
                      <div className="text-sm sm:text-sm font-bold text-green-700">
                        {Math.floor(route.totalDuration / 60)}h{String(Math.round(route.totalDuration % 60)).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional details - more compact */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Car className="h-3 w-3 mr-1" />
                        Véhicule:
                      </span>
                      <span className="font-medium text-gray-900">
                        {vehicleType === 'car' ? 'Voiture' : 'Camion'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        Arrêts:
                      </span>
                      <span className="font-medium text-gray-900">{route.locations.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Settings2 className="h-3 w-3 mr-1" />
                        Méthode:
                      </span>
                      <span className="font-medium text-gray-900 text-right">
                        {optimizationMethod === 'shortest_distance' ? 'Distance' : 
                         optimizationMethod === 'fastest_time' ? 'Temps' : 'Équilibré'}
                      </span>
                    </div>
                    
                    {isLoop && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center">
                          <Navigation className="h-3 w-3 mr-1" />
                          Trajet en boucle
                        </span>
                        <span className="font-medium text-green-600">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Détails - Mobile: last order, Desktop: Columns 2-4, Row 4 */}
          {route && (
            <div className="order-5 lg:col-span-3 lg:row-span-1">
              <div className="card h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    Étapes Détaillées
                  </h2>
                  <button
                    onClick={() => setShowResults(true)}
                    className="btn-primary text-xs px-3 py-2 touch-manipulation"
                  >
                    Voir Détails
                  </button>
                </div>
                
                <div className="flex-1 min-h-0 overflow-y-auto max-h-48 lg:max-h-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {route.segments.map((segment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate text-xs">
                              {trimAddress(segment.from.address)}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Navigation className="h-3 w-3 mr-1" />
                              {trimAddress(segment.to.address)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-xs font-medium text-gray-900">
                            {segment.distance.toFixed(1)} km
                          </div>
                          <div className="text-xs text-gray-500 flex items-center justify-end">
                            <Clock className="h-3 w-3 mr-1" />
                            {Math.round(segment.duration)} min
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Popup Modal */}
      {showExportPopup && route && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowExportPopup(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Export & Partage du Trajet</h2>
                <button
                  onClick={() => setShowExportPopup(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <RouteExport route={route} />
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal - Lazy Loaded */}
      <LazyFileUpload
        isOpen={showFileUpload}
        onLocationsLoaded={handleFileUpload}
        onClose={() => setShowFileUpload(false)}
        existingLocationsCount={locations.length}
      />

      {/* Notifications */}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
        position="top-right"
      />
    </div>
  );
}

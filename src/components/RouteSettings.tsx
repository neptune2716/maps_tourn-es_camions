import { useState } from 'react';
import { Settings2, Truck, Car, Route, Clock, Fuel, ChevronDown, ChevronUp } from 'lucide-react';
import { VehicleType, OptimizationMethod } from '../types/index.ts';

interface RouteSettingsProps {
  vehicleType: VehicleType;
  optimizationMethod: OptimizationMethod;
  isLoop: boolean;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  onVehicleTypeChange: (type: VehicleType) => void;
  onOptimizationMethodChange: (method: OptimizationMethod) => void;
  onLoopChange: (isLoop: boolean) => void;
  onAvoidTollsChange?: (avoid: boolean) => void;
  onAvoidHighwaysChange?: (avoid: boolean) => void;
}

interface VehicleOption {
  type: VehicleType;
  label: string;
  icon: any;
  description: string;
  estimatedSpeed: string;
}

interface OptimizationOption {
  method: OptimizationMethod;
  label: string;
  icon: any;
  description: string;
  color: string;
}

export default function RouteSettings({
  vehicleType,
  optimizationMethod,
  isLoop,
  avoidTolls = false,
  avoidHighways = false,
  onVehicleTypeChange,
  onOptimizationMethodChange,
  onLoopChange,
  onAvoidTollsChange,
  onAvoidHighwaysChange
}: RouteSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const vehicleOptions: VehicleOption[] = [
    {
      type: 'car',
      label: 'Voiture',
      icon: Car,
      description: 'Véhicule léger, toutes routes autorisées',
      estimatedSpeed: '80 km/h'
    },
    {
      type: 'truck',
      label: 'Camion',
      icon: Truck,
      description: 'Poids lourd, restrictions spécifiques',
      estimatedSpeed: '60 km/h'
    }
  ];

  const optimizationOptions: OptimizationOption[] = [
    {
      method: 'shortest_distance',
      label: 'Distance la plus courte',
      icon: Route,
      description: 'Minimise la distance totale parcourue',
      color: 'text-green-600'
    },
    {
      method: 'fastest_time',
      label: 'Temps le plus rapide',
      icon: Clock,
      description: 'Minimise le temps de trajet total',
      color: 'text-blue-600'
    },
    {
      method: 'balanced',
      label: 'Équilibré',
      icon: Fuel,
      description: 'Équilibre entre distance et temps',
      color: 'text-purple-600'
    }
  ];

  const selectedVehicle = vehicleOptions.find(v => v.type === vehicleType);
  const selectedOptimization = optimizationOptions.find(o => o.method === optimizationMethod);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Settings2 className="mr-2 h-5 w-5" />
          Paramètres de Route
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      <div className="space-y-6">
        {/* Vehicle Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type de Véhicule
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vehicleOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = vehicleType === option.type;
              
              return (
                <button
                  key={option.type}
                  onClick={() => onVehicleTypeChange(option.type)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all duration-200
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center mb-2">
                    <Icon className={`h-5 w-5 mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{option.description}</p>
                  <p className="text-xs text-gray-500">Vitesse estimée: {option.estimatedSpeed}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optimization Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Méthode d'Optimisation
          </label>
          <div className="space-y-2">
            {optimizationOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = optimizationMethod === option.method;
              
              return (
                <button
                  key={option.method}
                  onClick={() => onOptimizationMethodChange(option.method)}
                  className={`
                    w-full p-3 rounded-lg border text-left transition-all duration-200
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Icon className={`h-4 w-4 mr-3 ${isSelected ? 'text-blue-600' : option.color}`} />
                    <div className="flex-1">
                      <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loop Option */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="mr-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Route className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Trajet en boucle</div>
              <div className="text-sm text-gray-600">Retourner au point de départ</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isLoop}
              onChange={(e) => onLoopChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Advanced Options (Expanded) */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Options Avancées</h3>
            
            {/* Avoid Tolls */}
            {onAvoidTollsChange && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">Éviter les péages</span>
                  <span className="ml-2 text-xs text-gray-500">(Expérimental)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={avoidTolls}
                    onChange={(e) => onAvoidTollsChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            )}

            {/* Avoid Highways */}
            {onAvoidHighwaysChange && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">Éviter les autoroutes</span>
                  <span className="ml-2 text-xs text-gray-500">(Expérimental)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={avoidHighways}
                    onChange={(e) => onAvoidHighwaysChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            )}

            {/* Vehicle Info */}
            {selectedVehicle && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <selectedVehicle.icon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Informations véhicule:</p>
                    <p>{selectedVehicle.description}</p>
                    <p className="mt-1">Vitesse moyenne estimée: {selectedVehicle.estimatedSpeed}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current Selection Summary */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>Configuration actuelle:</span>
            <span className="font-medium text-gray-900">
              {selectedVehicle?.label} • {selectedOptimization?.label}
              {isLoop ? ' • Boucle' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

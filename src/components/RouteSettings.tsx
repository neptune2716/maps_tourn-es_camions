import { Truck, Car, Route, Clock, Fuel } from 'lucide-react';
import { VehicleType, OptimizationMethod } from '../types/index.ts';

interface RouteSettingsProps {
  vehicleType: VehicleType;
  optimizationMethod: OptimizationMethod;
  isLoop: boolean;
  onVehicleTypeChange: (type: VehicleType) => void;
  onOptimizationMethodChange: (method: OptimizationMethod) => void;
  onLoopChange: (isLoop: boolean) => void;
  disabled?: boolean; // Nouveau prop pour désactiver pendant les calculs
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
  onVehicleTypeChange,
  onOptimizationMethodChange,
  onLoopChange,
  disabled = false
}: RouteSettingsProps) {
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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Type de Véhicule
        </label>
        <div className="grid grid-cols-1 gap-3">
          {vehicleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = vehicleType === option.type;
            
            return (
              <button
                key={option.type}
                onClick={() => !disabled && onVehicleTypeChange(option.type)}
                disabled={disabled}
                className={'p-3 rounded-lg border-2 text-left transition-all duration-200 ' + 
                  (disabled ? 'opacity-50 cursor-not-allowed' : '') +
                  (isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                }
              >
                <div className="flex items-center mb-2">
                  <Icon className={'h-4 w-4 mr-2 ' + (isSelected ? 'text-blue-600' : 'text-gray-600')} />
                  <span className={'font-medium text-sm ' + (isSelected ? 'text-blue-900' : 'text-gray-900')}>
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
                onClick={() => !disabled && onOptimizationMethodChange(option.method)}
                disabled={disabled}
                className={'w-full p-3 rounded-lg border text-left transition-all duration-200 ' + 
                  (disabled ? 'opacity-50 cursor-not-allowed' : '') +
                  (isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                }
              >
                <div className="flex items-center">
                  <Icon className={'h-4 w-4 mr-3 ' + (isSelected ? 'text-blue-600' : option.color)} />
                  <div className="flex-1">
                    <div className={'font-medium text-sm ' + (isSelected ? 'text-blue-900' : 'text-gray-900')}>
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

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="mr-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Route className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900">Trajet en boucle</div>
            <div className="text-xs text-gray-600">Retourner au point de départ</div>
          </div>
        </div>
        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={isLoop}
            onChange={(e) => !disabled && onLoopChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
}

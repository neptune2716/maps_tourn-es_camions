import { useState } from 'react';
import { 
  Navigation, 
  ChevronRight, 
  MapPin, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy
} from 'lucide-react';
import { Route } from '../types/index.ts';
import { trimAddress } from '../utils/routeUtils.ts';
import { useNotifications } from './Notification.tsx';

interface DrivingDirectionsProps {
  route: Route;
}

interface Instruction {
  step: number;
  from: string;
  to: string;
  distance: number;
  duration: number;
  direction: string;
  icon: string;
}

export default function DrivingDirections({ route }: DrivingDirectionsProps) {
  const [showAllInstructions, setShowAllInstructions] = useState(false);
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const { addNotification } = useNotifications();

  const generateInstructions = (): Instruction[] => {
    const instructions: Instruction[] = [];
    
    route.segments.forEach((segment, index) => {
      instructions.push({
        step: index + 1,
        from: segment.from.address,
        to: segment.to.address,
        distance: segment.distance,
        duration: segment.duration,
        direction: generateDirectionText(segment.from.address, segment.to.address),
        icon: '🚗'
      });
    });

    return instructions;
  };

  const generateDirectionText = (from: string, to: string): string => {
    // Directions simplifiées basées sur les adresses
    return `Dirigez-vous vers ${trimAddress(to)} depuis ${trimAddress(from)}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    }
    return `${Math.round(minutes)} min`;
  };

  const toggleSegmentExpansion = (index: number) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSegments(newExpanded);
  };

  const copyDirections = () => {
    const instructions = generateInstructions();
    const text = generateTextDirections(instructions);
    
    navigator.clipboard.writeText(text).then(() => {
      addNotification({
        type: 'success',
        title: 'Instructions copiées',
        message: 'Les instructions de navigation ont été copiées dans le presse-papiers.',
        autoClose: true
      });
    });
  };

  const generateTextDirections = (instructions: Instruction[]): string => {
    const date = new Date().toLocaleDateString('fr-FR');
    let text = `INSTRUCTIONS DE NAVIGATION\nGénéré le ${date}\n\n`;
    text += `Trajet: ${route.totalDistance.toFixed(1)} km - ${formatDuration(route.totalDuration)}\n`;
    text += `Véhicule: ${route.vehicleType === 'car' ? 'Voiture' : 'Camion'}\n\n`;
    
    instructions.forEach((instruction) => {
      text += `${instruction.step}. ${instruction.direction}\n`;
      text += `   Distance: ${instruction.distance.toFixed(1)} km\n`;
      text += `   Durée: ${formatDuration(instruction.duration)}\n\n`;
    });

    if (route.isLoop) {
      text += `${instructions.length + 1}. Retour au point de départ\n`;
    }

    return text;
  };

  const instructions = generateInstructions();
  const visibleInstructions = showAllInstructions ? instructions : instructions.slice(0, 5);

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Navigation className="mr-2 h-5 w-5" />
          Instructions de Navigation
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={copyDirections}
            className="btn-outline text-sm flex items-center px-3 py-1"
          >
            <Copy className="mr-1 h-4 w-4" />
            Copier
          </button>
          <button
            onClick={() => window.print()}
            className="btn-outline text-sm flex items-center px-3 py-1"
          >
            <Printer className="mr-1 h-4 w-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Trip Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">Trajet Total</span>
          </div>
          <div className="text-sm text-blue-700">
            {route.locations.length} arrêts
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Distance:</span>
            <span className="ml-2 font-semibold text-blue-900">{route.totalDistance.toFixed(1)} km</span>
          </div>
          <div>
            <span className="text-blue-700">Durée estimée:</span>
            <span className="ml-2 font-semibold text-blue-900">{formatDuration(route.totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Instructions */}
      <div className="space-y-3">
        {visibleInstructions.map((instruction, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSegmentExpansion(index)}
              className="w-full p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {instruction.step}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {trimAddress(instruction.from)}
                    </div>
                    <div className="flex items-center text-gray-600 text-xs mt-1">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {trimAddress(instruction.to)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">
                      {instruction.distance.toFixed(1)} km
                    </div>
                    <div className="text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(instruction.duration)}
                    </div>
                  </div>
                  {expandedSegments.has(index) ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> :
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedSegments.has(index) && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Instructions détaillées:</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{instruction.direction}</span>
                    </div>
                    <div className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Suivez les panneaux directionnels vers votre destination</span>
                    </div>
                    <div className="flex items-start">
                      <ChevronRight className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Respectez les limitations de vitesse et la signalisation</span>
                    </div>
                  </div>
                  
                  {/* Coordinates if available */}
                  {route.segments[index]?.to.coordinates && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        <div className="font-medium mb-1">Coordonnées de destination:</div>
                        <div>
                          Lat: {route.segments[index].to.coordinates!.latitude.toFixed(6)}, 
                          Lon: {route.segments[index].to.coordinates!.longitude.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loop Return Instruction */}
        {route.isLoop && showAllInstructions && (
          <div className="border border-gray-200 rounded-lg p-4 bg-amber-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {instructions.length + 1}
              </div>
              <div>
                <div className="font-medium text-amber-900 text-sm">
                  Retour au point de départ
                </div>
                <div className="flex items-center text-amber-700 text-xs mt-1">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  {trimAddress(route.locations[0]?.address || '')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show More/Less Button */}
        {instructions.length > 5 && (
          <div className="text-center">
            <button
              onClick={() => setShowAllInstructions(!showAllInstructions)}
              className="btn-outline flex items-center mx-auto"
            >
              {showAllInstructions ? (
                <>
                  Voir moins <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Voir toutes les instructions ({instructions.length}) <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Notes Importantes</h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Vérifiez les conditions de circulation en temps réel</li>
          <li>Ces instructions sont basées sur des estimations</li>
          <li>Respectez le code de la route et les limitations de vitesse</li>
          {route.vehicleType === 'truck' && (
            <li>Attention aux restrictions de circulation pour poids lourds</li>
          )}
          <li>Prévoyez des pauses régulières pour les longs trajets</li>
        </ul>
      </div>
    </div>
  );
}

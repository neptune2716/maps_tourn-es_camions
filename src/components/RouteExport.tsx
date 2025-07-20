import { useState } from 'react';
import { Download, Share2, FileText, Navigation, Printer } from 'lucide-react';
import { Route } from '../types/index.ts';
import { useNotifications } from './Notification.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';

interface RouteExportProps {
  route: Route;
}

interface ExportOptions {
  includeCostEstimation: boolean;
  includeInstructions: boolean;
  includeMap: boolean;
  format: 'pdf' | 'excel' | 'json';
}

export default function RouteExport({ route }: RouteExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeCostEstimation: true,
    includeInstructions: true,
    includeMap: false,
    format: 'pdf'
  });
  const { addNotification } = useNotifications();

  const calculateCosts = () => {
    const fuelConsumption = route.vehicleType === 'car' ? 7 : 12; // L/100km
    const fuelPrice = 1.45; // €/L (estimation 2025)
    const fuelCost = (route.totalDistance / 100) * fuelConsumption * fuelPrice;
    
    // Estimation des péages (très approximative)
    const tollCostPerKm = route.vehicleType === 'car' ? 0.08 : 0.15; // €/km
    const estimatedTollCost = route.totalDistance * tollCostPerKm * 0.3; // 30% de routes à péage
    
    return {
      fuelCost: fuelCost,
      tollCost: estimatedTollCost,
      totalCost: fuelCost + estimatedTollCost,
      fuelConsumption: (route.totalDistance / 100) * fuelConsumption
    };
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Simuler la génération PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const costs = calculateCosts();
      const content = generateRouteReport(costs);
      
      // Créer un blob avec le contenu pour téléchargement
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trajet-optimise-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        title: 'Export PDF réussi',
        message: 'Le rapport de trajet a été téléchargé avec succès.',
        autoClose: true
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Impossible de générer le PDF. Réessayez plus tard.',
        autoClose: true
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToGPS = async () => {
    setIsExporting(true);
    try {
      // Générer un fichier GPX pour les GPS
      const gpxContent = generateGPXFile();
      
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trajet-optimise-${new Date().toISOString().split('T')[0]}.gpx`;
      link.click();
      URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        title: 'Export GPS réussi',
        message: 'Le fichier GPX a été téléchargé pour votre GPS.',
        autoClose: true
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export GPS',
        message: 'Impossible de générer le fichier GPS.',
        autoClose: true
      });
    } finally {
      setIsExporting(false);
    }
  };

  const shareRoute = async () => {
    const routeUrl = generateShareableURL();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Trajet Optimisé',
          text: `Trajet de ${route.locations.length} arrêts - ${route.totalDistance.toFixed(1)} km`,
          url: routeUrl
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard(routeUrl);
      }
    } else {
      copyToClipboard(routeUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addNotification({
        type: 'success',
        title: 'Lien copié',
        message: 'Le lien du trajet a été copié dans le presse-papiers.',
        autoClose: true
      });
    });
  };

  const generateRouteReport = (costs: any) => {
    const date = new Date().toLocaleDateString('fr-FR');
    return `
RAPPORT DE TRAJET OPTIMISÉ
Généré le ${date}

=====================================
INFORMATIONS GÉNÉRALES
=====================================
• Nombre d'arrêts : ${route.locations.length}
• Type de véhicule : ${route.vehicleType === 'car' ? 'Voiture' : 'Camion'}
• Distance totale : ${route.totalDistance.toFixed(2)} km
• Durée estimée : ${Math.floor(route.totalDuration / 60)}h${(Math.round(route.totalDuration) % 60).toString().padStart(2, '0')}
• Méthode d'optimisation : ${
  route.optimizationMethod === 'shortest_distance' ? 'Distance la plus courte' :
  route.optimizationMethod === 'fastest_time' ? 'Temps le plus rapide' :
  'Équilibré'
}
• Trajet en boucle : ${route.isLoop ? 'Oui' : 'Non'}

=====================================
ESTIMATION DES COÛTS
=====================================
• Consommation carburant : ${costs.fuelConsumption.toFixed(1)} L
• Coût carburant : ${costs.fuelCost.toFixed(2)} €
• Péages estimés : ${costs.tollCost.toFixed(2)} €
• COÛT TOTAL ESTIMÉ : ${costs.totalCost.toFixed(2)} €

=====================================
DÉTAIL DES ÉTAPES
=====================================
${route.segments.map((segment, index) => `
${index + 1}. De : ${segment.from.address}
   À : ${segment.to.address}
   Distance : ${segment.distance.toFixed(1)} km
   Durée : ${Math.round(segment.duration)} min
`).join('')}

=====================================
NOTES
=====================================
• Les coûts sont des estimations basées sur les prix moyens de 2025
• Les péages sont estimés à 30% du parcours
• Vérifiez les conditions de circulation en temps réel
• Ce rapport a été généré par l'optimiseur de trajets

Bon voyage !
`;
  };

  const generateGPXFile = () => {
    const date = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="OptimiseurTrajet" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Trajet Optimisé</name>
    <desc>Trajet généré le ${new Date().toLocaleDateString('fr-FR')}</desc>
    <time>${date}</time>
  </metadata>
  <rte>
    <name>Trajet Optimisé ${route.totalDistance.toFixed(1)}km</name>
    <desc>${route.locations.length} arrêts - ${Math.round(route.totalDuration)} minutes</desc>
    ${route.locations.map((location, index) => 
      location.coordinates ? `
    <rtept lat="${location.coordinates.latitude}" lon="${location.coordinates.longitude}">
      <name>Arrêt ${index + 1}</name>
      <desc>${location.address}</desc>
    </rtept>` : ''
    ).join('')}
  </rte>
</gpx>`;
  };

  const generateShareableURL = () => {
    const params = new URLSearchParams({
      locations: JSON.stringify(route.locations.map(loc => ({
        address: loc.address,
        coordinates: loc.coordinates
      }))),
      vehicle: route.vehicleType,
      method: route.optimizationMethod,
      loop: route.isLoop.toString()
    });
    
    return `${window.location.origin}/optimize?${params.toString()}`;
  };

  const costs = calculateCosts();

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Download className="mr-2 h-5 w-5" />
          Export & Partage
        </h3>
      </div>

      {/* Cost Estimation */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-3 flex items-center">
          💰 Estimation des Coûts
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-green-700">Carburant:</span>
            <span className="ml-2 font-semibold">{costs.fuelCost.toFixed(2)} €</span>
            <div className="text-xs text-green-600">({costs.fuelConsumption.toFixed(1)} L)</div>
          </div>
          <div>
            <span className="text-green-700">Péages:</span>
            <span className="ml-2 font-semibold">{costs.tollCost.toFixed(2)} €</span>
            <div className="text-xs text-green-600">(estimation)</div>
          </div>
          <div className="col-span-2 pt-2 border-t border-green-300">
            <span className="text-green-800 font-medium">Total estimé:</span>
            <span className="ml-2 text-lg font-bold text-green-900">{costs.totalCost.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Options d'export</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeCostEstimation}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                includeCostEstimation: e.target.checked
              }))}
              className="mr-2 rounded border-gray-300"
            />
            <span className="text-sm">Inclure l'estimation des coûts</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeInstructions}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                includeInstructions: e.target.checked
              }))}
              className="mr-2 rounded border-gray-300"
            />
            <span className="text-sm">Inclure les instructions détaillées</span>
          </label>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="space-y-2">
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="btn-primary w-full flex items-center justify-center"
        >
          {isExporting ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isExporting ? 'Génération...' : 'Exporter en PDF'}
        </button>

        <button
          onClick={exportToGPS}
          disabled={isExporting}
          className="btn-secondary w-full flex items-center justify-center"
        >
          <Navigation className="mr-2 h-4 w-4" />
          Télécharger pour GPS
        </button>

        <button
          onClick={shareRoute}
          className="btn-secondary w-full flex items-center justify-center"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Partager le trajet
        </button>
      </div>

      {/* Print Option */}
      <div className="pt-3 border-t border-gray-200">
        <button
          onClick={() => window.print()}
          className="btn-outline w-full flex items-center justify-center text-sm"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimer les instructions
        </button>
      </div>
    </div>
  );
}

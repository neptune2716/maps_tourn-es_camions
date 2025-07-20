import { useState } from 'react';
import { Download, Share2, Navigation } from 'lucide-react';
import { Route } from '../types/index.ts';
import { useNotifications } from './Notification.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import jsPDF from 'jspdf';
import L from 'leaflet';

interface RouteExportProps {
  route: Route;
}

export default function RouteExport({ route }: RouteExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState('');
  const { addNotification } = useNotifications();

  // Fonction helper pour formater les durées
  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h${mins.toString().padStart(2, '0')}`;
    } else {
      return `${Math.round(minutes)} min`;
    }
  };

  const captureMapAndGeneratePDF = async () => {
    try {
      // Générer une carte simple pour le PDF
      const mapImageData = await generateSimpleMapForPDF();
      return generateComprehensivePDF(mapImageData);
    } catch (error) {
      console.warn('Impossible de générer la carte, génération du PDF sans carte', error);
      return generateComprehensivePDF(null);
    }
  };

  const generateSimpleMapForPDF = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Taille optimisée pour le PDF (ratio 3:2 standard)
        const mapWidth = 800;
        const mapHeight = 533;
        
        // Créer un conteneur temporaire avec les bonnes dimensions
        const tempContainer = document.createElement('div');
        tempContainer.style.width = `${mapWidth}px`;
        tempContainer.style.height = `${mapHeight}px`;
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.overflow = 'hidden';
        tempContainer.style.border = 'none';
        tempContainer.style.background = '#f8f9fa';
        document.body.appendChild(tempContainer);

        // Vérifier qu'on a des coordonnées valides
        const validLocations = route.locations.filter(loc => loc.coordinates);
        if (validLocations.length === 0) {
          document.body.removeChild(tempContainer);
          reject(new Error('Aucune coordonnée valide'));
          return;
        }

        // Calculer le centre et les bounds
        const lats = validLocations.map(loc => loc.coordinates!.latitude);
        const lngs = validLocations.map(loc => loc.coordinates!.longitude);
        const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
        const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;

        // Créer la carte avec renderer Canvas pour de meilleures performances
        const map = L.map(tempContainer, {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          preferCanvas: true,
          renderer: L.canvas({
            tolerance: 0,
            padding: 0.1
          })
        }).setView([centerLat, centerLng], 10);

        // Ajouter les tuiles avec paramètres optimisés pour l'export
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 16,
          minZoom: 5,
          detectRetina: false,
          crossOrigin: 'anonymous'
        });
        tileLayer.addTo(map);

        // Attendre que les tuiles se chargent puis continuer
        let tilesLoaded = false;
        const tileLoadTimeout = setTimeout(() => {
          if (!tilesLoaded) {
            console.warn('Timeout: tiles not loaded, proceeding anyway');
            proceedWithMapCreation();
          }
        }, 3000);

        tileLayer.on('load', () => {
          tilesLoaded = true;
          clearTimeout(tileLoadTimeout);
          proceedWithMapCreation();
        });

        // Si pas de tiles à charger, procéder directement
        setTimeout(() => {
          if (!tilesLoaded) {
            tilesLoaded = true;
            clearTimeout(tileLoadTimeout);
            proceedWithMapCreation();
          }
        }, 500);

        function proceedWithMapCreation() {
          // Invalider la taille de la carte
          map.invalidateSize(true);
          
          // Calculer et ajuster la vue selon le nombre de points
          if (validLocations.length === 1) {
            map.setView([validLocations[0].coordinates!.latitude, validLocations[0].coordinates!.longitude], 15);
          } else {
            const leafletBounds = L.latLngBounds(
              validLocations.map(loc => [loc.coordinates!.latitude, loc.coordinates!.longitude])
            );
            map.fitBounds(leafletBounds.pad(0.01), { maxZoom: 16 }); // Padding minimal + zoom max
          }

          // Ajouter les marqueurs avec un style optimisé
          validLocations.forEach((location, index) => {
            const iconColor = location.isLocked ? '#dc2626' : '#2563eb';
            const customIcon = L.divIcon({
              html: `
                <div style="
                  width: 32px;
                  height: 32px;
                  background-color: ${iconColor};
                  border: 3px solid white;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: white;
                  font-size: 14px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                  font-family: Arial, sans-serif;
                  line-height: 1;
                ">
                  ${index + 1}
                </div>
              `,
              className: 'custom-marker-export',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            L.marker([location.coordinates!.latitude, location.coordinates!.longitude], {
              icon: customIcon
            }).addTo(map);
          });

          // Ajouter les routes si disponibles
          if (route.segments && route.segments.length > 0) {
            route.segments.forEach((segment, index) => {
              if (segment.polyline && segment.polyline.coordinates) {
                const coordinates = segment.polyline.coordinates.map((coord: number[]) => 
                  [coord[1], coord[0]] as L.LatLngExpression
                );
                
                if (coordinates.length > 1) {
                  const isReturnSegment = index === route.segments.length - 1 && route.isLoop;
                  L.polyline(coordinates, {
                    color: isReturnSegment ? '#ef4444' : '#3b82f6',
                    weight: 4,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }).addTo(map);
                }
              } else if (segment.from.coordinates && segment.to.coordinates) {
                L.polyline([
                  [segment.from.coordinates.latitude, segment.from.coordinates.longitude],
                  [segment.to.coordinates.latitude, segment.to.coordinates.longitude]
                ], {
                  color: '#94a3b8',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '8, 8'
                }).addTo(map);
              }
            });
          }

          // Capturer la carte après un délai pour s'assurer du rendu complet
          setTimeout(async () => {
            try {
              const { default: html2canvas } = await import('html2canvas');
              
              // Capturer avec des paramètres optimisés pour éviter la déformation
              const canvas = await html2canvas(tempContainer, {
                backgroundColor: '#f8f9fa',
                scale: 1, // Échelle 1:1 pour éviter les distorsions
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: mapWidth,
                height: mapHeight,
                ignoreElements: (element) => {
                  // Ignorer les éléments de contrôle Leaflet
                  return element.classList?.contains('leaflet-control-attribution') ||
                         element.classList?.contains('leaflet-control-zoom');
                }
              });
              
              const mapImage = canvas.toDataURL('image/png', 0.9);
              
              // Nettoyer
              document.body.removeChild(tempContainer);
              map.remove();
              
              resolve(mapImage);
            } catch (error) {
              document.body.removeChild(tempContainer);
              map.remove();
              reject(error);
            }
          }, 800);
        }

      } catch (error) {
        reject(error);
      }
    });
  };

  const generateComprehensivePDF = (mapImageData: string | null) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // === PAGE 1: TITRE ET INFORMATIONS GÉNÉRALES ===
    
    // En-tête avec titre principal
    pdf.setFillColor(52, 152, 219); // Bleu professionnel
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RAPPORT DE TRAJET OPTIMISE', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    pdf.text(`Genere le ${currentDate} a ${currentTime}`, pageWidth / 2, 28, { align: 'center' });
    
    yPosition = 50;
    pdf.setTextColor(0, 0, 0);
    
    // Section Informations avec boxes individuelles
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(52, 152, 219);
    pdf.text('INFORMATIONS DU TRAJET', 20, yPosition);
    
    yPosition += 15;
    
    // Configuration des boxes
    const boxWidth = (pageWidth - 50) / 3; // 3 colonnes
    const boxHeight = 35;
    const spacing = 10;
    
    // Box 1: Nombre d'arrêts
    const box1X = 15;
    const box1Y = yPosition;
    pdf.setFillColor(240, 248, 255);
    pdf.rect(box1X, box1Y, boxWidth, boxHeight, 'F');
    pdf.setDrawColor(52, 152, 219);
    pdf.setLineWidth(1);
    pdf.rect(box1X, box1Y, boxWidth, boxHeight);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(52, 152, 219);
    pdf.text(`${route.locations.length}`, box1X + boxWidth/2, box1Y + 18, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('ARRÊTS', box1X + boxWidth/2, box1Y + 28, { align: 'center' });
    
    // Box 2: Distance totale
    const box2X = box1X + boxWidth + spacing;
    const box2Y = yPosition;
    pdf.setFillColor(248, 255, 240);
    pdf.rect(box2X, box2Y, boxWidth, boxHeight, 'F');
    pdf.setDrawColor(76, 175, 80);
    pdf.rect(box2X, box2Y, boxWidth, boxHeight);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(76, 175, 80);
    pdf.text(`${route.totalDistance.toFixed(1)} km`, box2X + boxWidth/2, box2Y + 18, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('DISTANCE', box2X + boxWidth/2, box2Y + 28, { align: 'center' });
    
    // Box 3: Durée estimée
    const box3X = box2X + boxWidth + spacing;
    const box3Y = yPosition;
    pdf.setFillColor(255, 245, 235);
    pdf.rect(box3X, box3Y, boxWidth, boxHeight, 'F');
    pdf.setDrawColor(255, 152, 0);
    pdf.rect(box3X, box3Y, boxWidth, boxHeight);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 152, 0);
    pdf.text(formatDuration(route.totalDuration), box3X + boxWidth/2, box3Y + 18, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('DURÉE', box3X + boxWidth/2, box3Y + 28, { align: 'center' });
    
    yPosition += boxHeight + 15;
    
    // Deuxième ligne de boxes
    const box2Width = (pageWidth - 40) / 2; // 2 colonnes pour la deuxième ligne
    
    // Box 4: Type de véhicule
    const box4X = 15;
    const box4Y = yPosition;
    pdf.setFillColor(250, 240, 255);
    pdf.rect(box4X, box4Y, box2Width, boxHeight, 'F');
    pdf.setDrawColor(156, 39, 176);
    pdf.rect(box4X, box4Y, box2Width, boxHeight);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(156, 39, 176);
    pdf.text(`${route.vehicleType === 'car' ? 'VOITURE' : 'CAMION'}`, box4X + box2Width/2, box4Y + 18, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('VÉHICULE', box4X + box2Width/2, box4Y + 28, { align: 'center' });
    
    // Box 5: Trajet en boucle
    const box5X = box4X + box2Width + spacing;
    const box5Y = yPosition;
    if (route.isLoop) {
      pdf.setFillColor(248, 255, 240);
      pdf.setDrawColor(76, 175, 80);
    } else {
      pdf.setFillColor(255, 248, 248);
      pdf.setDrawColor(220, 53, 69);
    }
    pdf.rect(box5X, box5Y, box2Width, boxHeight, 'F');
    pdf.rect(box5X, box5Y, box2Width, boxHeight);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    if (route.isLoop) {
      pdf.setTextColor(76, 175, 80);
    } else {
      pdf.setTextColor(220, 53, 69);
    }
    pdf.text(`${route.isLoop ? 'OUI' : 'NON'}`, box5X + box2Width/2, box5Y + 18, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('BOUCLE', box5X + box2Width/2, box5Y + 28, { align: 'center' });
    
    yPosition += boxHeight + 20;
    
    // === CARTE SUR LA PREMIÈRE PAGE ===
    
    // Insertion de la carte
    if (mapImageData) {
      try {
        // Calculer les dimensions pour maintenir l'aspect ratio 3:2
        const availableWidth = pageWidth - 30;
        const availableHeight = 120; // Plus d'espace pour la carte
        
        // Aspect ratio original de la carte (3:2)
        const originalRatio = 800 / 533;
        
        let mapWidth = availableWidth;
        let mapHeight = mapWidth / originalRatio;
        
        // Si la hauteur dépasse l'espace disponible, ajuster par la hauteur
        if (mapHeight > availableHeight) {
          mapHeight = availableHeight;
          mapWidth = mapHeight * originalRatio;
        }
        
        // Centrer horizontalement si nécessaire
        const mapX = 15 + (availableWidth - mapWidth) / 2;
        
        pdf.addImage(mapImageData, 'PNG', mapX, yPosition, mapWidth, mapHeight, undefined, 'FAST');
        yPosition += mapHeight + 10;
      } catch (error) {
        console.warn('Erreur insertion carte:', error);
        // Fallback en cas d'erreur
        pdf.setFillColor(245, 245, 245);
        pdf.rect(15, yPosition, pageWidth - 30, 80, 'F');
        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Carte temporairement indisponible', pageWidth / 2, yPosition + 40, { align: 'center' });
        yPosition += 90;
      }
    } else {
      // Placeholder pour la carte
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPosition, pageWidth - 30, 80, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(15, yPosition, pageWidth - 30, 80);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Carte du trajet', pageWidth / 2, yPosition + 25, { align: 'center' });
      pdf.text('Consultez l\'application pour la visualisation', pageWidth / 2, yPosition + 40, { align: 'center' });
      pdf.text(`${route.locations.length} points sur ${route.totalDistance.toFixed(1)} km`, pageWidth / 2, yPosition + 55, { align: 'center' });
      yPosition += 90;
    }
    
    // === PAGE 2: DÉTAIL DES ÉTAPES ===
    pdf.addPage();
    yPosition = 20;
    
    // En-tête page détails
    pdf.setFillColor(156, 39, 176); // Violet
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETAIL DES ETAPES', pageWidth / 2, 16, { align: 'center' });
    
    yPosition = 40;
    pdf.setTextColor(0, 0, 0);
    
    route.segments.forEach((segment, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > pageHeight - 70) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Encadré pour chaque étape
      const stepHeight = 50;
      
      // Couleur de fond alternée
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.rect(15, yPosition - 5, pageWidth - 30, stepHeight, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(15, yPosition - 5, pageWidth - 30, stepHeight);
      
      // Numéro d'étape
      pdf.setFillColor(156, 39, 176);
      pdf.circle(25, yPosition + 10, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}`, 25, yPosition + 13, { align: 'center' });
      
      // Informations de l'étape
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DEPART:', 40, yPosition + 5);
      pdf.setFont('helvetica', 'normal');
      
      // Limiter la longueur des adresses
      const fromAddress = segment.from.address.length > 45 ? segment.from.address.substring(0, 45) + '...' : segment.from.address;
      const toAddress = segment.to.address.length > 45 ? segment.to.address.substring(0, 45) + '...' : segment.to.address;
      
      pdf.text(fromAddress, 75, yPosition + 5);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('ARRIVEE:', 40, yPosition + 15);
      pdf.setFont('helvetica', 'normal');
      pdf.text(toAddress, 75, yPosition + 15);
      
      // Métriques de l'étape simplifiées
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(76, 175, 80);
      pdf.text(`${segment.distance.toFixed(1)} km`, 40, yPosition + 30);
      
      pdf.setTextColor(255, 152, 0);
      pdf.text(formatDuration(segment.duration), 90, yPosition + 30);
      
      yPosition += stepHeight + 5;
    });
    
    // Footer professionnel
    const footerY = pageHeight - 25;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, footerY, pageWidth, 25, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.line(0, footerY, pageWidth, footerY);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Genere par l\'Optimiseur de Trajets', 20, footerY + 10);
    pdf.text(`${currentDate} - ${currentTime}`, pageWidth - 20, footerY + 10, { align: 'right' });
    pdf.text('Application web de planification de trajets', pageWidth / 2, footerY + 18, { align: 'center' });
    
    return pdf;
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    setExportStep('Préparation...');
    
    try {
      addNotification({
        type: 'info',
        title: 'Génération en cours',
        message: 'Création de la carte et du rapport PDF...',
        autoClose: false
      });
      
      setExportStep('Génération de la carte...');
      
      // Ajouter un timeout pour éviter le blocage
      const pdfPromise = captureMapAndGeneratePDF();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Génération trop longue')), 15000)
      );
      
      const pdf = await Promise.race([pdfPromise, timeoutPromise]) as jsPDF;
      
      setExportStep('Finalisation...');
      const fileName = `trajet-optimise-${new Date().toISOString().split('T')[0]}.pdf`;
      
      pdf.save(fileName);
      
      addNotification({
        type: 'success',
        title: 'Export PDF réussi',
        message: 'Le rapport complet a été téléchargé.',
        autoClose: true
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
      
      // En cas d'erreur avec la carte, générer le PDF sans carte
      try {
        setExportStep('Génération sans carte...');
        addNotification({
          type: 'warning',
          title: 'Génération sans carte',
          message: 'La carte n\'a pas pu être générée, création du PDF sans carte...',
          autoClose: true
        });
        
        const pdf = generateComprehensivePDF(null);
        const fileName = `trajet-optimise-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        addNotification({
          type: 'success',
          title: 'Export PDF réussi',
          message: 'Le rapport a été téléchargé (sans carte).',
          autoClose: true
        });
      } catch (fallbackError) {
        addNotification({
          type: 'error',
          title: 'Erreur d\'export',
          message: 'Impossible de générer le PDF. Vérifiez votre connexion et réessayez.',
          autoClose: true
        });
      }
    } finally {
      setIsExporting(false);
      setExportStep('');
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
    <desc>${route.locations.length} arrêts - ${formatDuration(route.totalDuration)}</desc>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Download className="mr-2 h-5 w-5" />
          Export & Partage
        </h3>
      </div>

      {/* Export Buttons */}
      <div className="space-y-3">
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="btn-primary w-full flex items-center justify-center"
        >
          {isExporting ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? exportStep || 'Génération en cours...' : 'Exporter Rapport PDF'}
        </button>

        <button
          onClick={() => {
            const pdf = generateComprehensivePDF(null);
            const fileName = `trajet-optimise-simple-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            addNotification({
              type: 'success',
              title: 'Export PDF simple réussi',
              message: 'Le rapport a été téléchargé (sans carte).',
              autoClose: true
            });
          }}
          className="btn-secondary w-full flex items-center justify-center"
        >
          <Download className="mr-2 h-4 w-4" />
          Export PDF Simple (sans carte)
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
    </div>
  );
}

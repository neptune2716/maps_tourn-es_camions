import { Location, Route, RouteSegment, VehicleType, OptimizationMethod, RouteOptimizationRequest, RouteOptimizationResponse } from '../types/index.ts';

export interface FreeRoutingProvider {
  calculateRoute(request: RouteOptimizationRequest): Promise<RouteOptimizationResponse>;
  geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null>;
}

export class OpenStreetMapRoutingService implements FreeRoutingProvider {
  private nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
  private osrmBaseUrl = 'https://router.project-osrm.org';

  async calculateRoute(request: RouteOptimizationRequest): Promise<RouteOptimizationResponse> {
    const startTime = Date.now();
    
    try {
      // S'assurer que tous les emplacements ont des coordonnées
      const locationsWithCoords = await this.ensureCoordinates(request.locations);
      
      if (locationsWithCoords.length < 2) {
        throw new Error('Au moins 2 emplacements sont requis pour calculer un trajet');
      }

      // Optimiser l'ordre des emplacements
      const optimizedLocations = await this.optimizeLocationOrder(
        locationsWithCoords,
        request.optimizationMethod,
        request.isLoop
      );

      // Calculer les segments du trajet
      const segments = await this.calculateRouteSegments(
        optimizedLocations,
        request.vehicleType,
        request.isLoop
      );

      const route: Route = {
        id: this.generateRouteId(),
        locations: optimizedLocations,
        totalDistance: segments.reduce((sum, seg) => sum + seg.distance, 0),
        totalDuration: segments.reduce((sum, seg) => sum + seg.duration, 0),
        vehicleType: request.vehicleType,
        isLoop: request.isLoop,
        segments,
        optimizationMethod: request.optimizationMethod,
      };

      return {
        route,
        metadata: {
          calculationTime: Date.now() - startTime,
          algorithm: 'openstreetmap-free',
          apiProvider: 'nominatim+osrm',
        },
      };
    } catch (error) {
      console.error('Échec du calcul de trajet:', error);
      throw new Error(`Impossible de calculer le trajet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.nominatimBaseUrl}/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RouteOptimizer/1.0.0 (https://github.com/yourproject/route-optimizer)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Échec du géocodage: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return { 
          latitude: parseFloat(result.lat), 
          longitude: parseFloat(result.lon) 
        };
      }
      
      return null;
    } catch (error) {
      console.error('Échec du géocodage:', error);
      return null;
    }
  }

  private async ensureCoordinates(locations: Location[]): Promise<Location[]> {
    const locationsWithCoords: Location[] = [];

    for (const location of locations) {
      if (location.coordinates) {
        locationsWithCoords.push(location);
      } else {
        // Essayer de géocoder l'adresse
        console.log(`Géocodage de: ${location.address}`);
        const coords = await this.geocodeAddress(location.address);
        if (coords) {
          locationsWithCoords.push({
            ...location,
            coordinates: coords,
          });
          console.log(`✓ Géocodé: ${location.address} -> ${coords.latitude}, ${coords.longitude}`);
        } else {
          console.warn(`✗ Impossible de géocoder: ${location.address}`);
        }
      }
    }

    return locationsWithCoords;
  }

  private async optimizeLocationOrder(
    locations: Location[],
    method: OptimizationMethod,
    _isLoop: boolean
  ): Promise<Location[]> {
    if (locations.length <= 2) {
      return locations;
    }

    // Séparer les emplacements verrouillés
    const lockedLocations = locations.filter(loc => loc.isLocked);
    const unlockedLocations = locations.filter(loc => !loc.isLocked);

    if (unlockedLocations.length === 0) {
      return locations.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // Algorithme du plus proche voisin pour les emplacements non verrouillés
    const optimized = await this.nearestNeighborOptimization(unlockedLocations, method);

    // Fusionner avec les emplacements verrouillés
    const result: Location[] = [];
    let optimizedIndex = 0;

    for (let i = 0; i < locations.length; i++) {
      const lockedAtPosition = lockedLocations.find(loc => loc.order === i);
      if (lockedAtPosition) {
        result.push(lockedAtPosition);
      } else if (optimizedIndex < optimized.length) {
        result.push(optimized[optimizedIndex++]);
      }
    }

    return result;
  }

  private async nearestNeighborOptimization(
    locations: Location[],
    method: OptimizationMethod
  ): Promise<Location[]> {
    if (locations.length <= 1) return locations;

    const visited = new Set<string>();
    const result: Location[] = [];
    let current = locations[0];
    
    result.push(current);
    visited.add(current.id);

    while (visited.size < locations.length) {
      let nearest: Location | null = null;
      let nearestDistance = Infinity;

      for (const location of locations) {
        if (visited.has(location.id) || !location.coordinates || !current.coordinates) {
          continue;
        }

        const distance = this.calculateDistance(current.coordinates, location.coordinates);
        
        let score = distance;
        if (method === 'fastest_time') {
          score = distance * 1.2; // Estimation simple
        } else if (method === 'balanced') {
          score = distance * 1.1;
        }

        if (score < nearestDistance) {
          nearest = location;
          nearestDistance = score;
        }
      }

      if (nearest) {
        result.push(nearest);
        visited.add(nearest.id);
        current = nearest;
      }
    }

    return result;
  }

  private async calculateRouteSegments(
    locations: Location[],
    vehicleType: VehicleType,
    isLoop: boolean
  ): Promise<RouteSegment[]> {
    const segments: RouteSegment[] = [];
    
    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i];
      const to = locations[i + 1];
      
      const segment = await this.calculateSegment(from, to, vehicleType);
      segments.push(segment);
    }

    // Ajouter le segment de retour pour les trajets en boucle
    if (isLoop && locations.length > 2) {
      const returnSegment = await this.calculateSegment(
        locations[locations.length - 1],
        locations[0],
        vehicleType
      );
      segments.push(returnSegment);
    }

    return segments;
  }

  private async calculateSegment(
    from: Location,
    to: Location,
    vehicleType: VehicleType
  ): Promise<RouteSegment> {
    if (!from.coordinates || !to.coordinates) {
      throw new Error('Les deux emplacements doivent avoir des coordonnées');
    }

    try {
      // Utiliser OSRM (gratuit) pour le calcul de trajet
      const profile = vehicleType === 'truck' ? 'driving' : 'driving'; // OSRM public n'a pas de profil camion
      const coordinates = `${from.coordinates.longitude},${from.coordinates.latitude};${to.coordinates.longitude},${to.coordinates.latitude}`;
      
      const url = `${this.osrmBaseUrl}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API OSRM failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          from,
          to,
          distance: route.distance / 1000, // Convertir en kilomètres
          duration: route.duration / 60, // Convertir en minutes
          instructions: route.legs[0]?.steps?.map((step: any) => 
            step.maneuver?.instruction || `Continuer pendant ${(step.distance/1000).toFixed(1)}km`
          ) || [],
          polyline: JSON.stringify(route.geometry),
        };
      } else {
        throw new Error('Aucun trajet trouvé');
      }
    } catch (error) {
      console.error('Échec du calcul de segment, utilisation de la ligne droite:', error);
      
      // Solution de secours: calcul en ligne droite
      const distance = this.calculateDistance(from.coordinates, to.coordinates);
      const estimatedSpeed = vehicleType === 'truck' ? 60 : 80; // km/h
      const duration = (distance / estimatedSpeed) * 60; // minutes

      return {
        from,
        to,
        distance,
        duration,
        instructions: [`Parcourir ${distance.toFixed(1)}km vers ${to.address}`],
        polyline: '',
      };
    }
  }

  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    // Formule de Haversine
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.degToRad(coord2.latitude - coord1.latitude);
    const dLon = this.degToRad(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(coord1.latitude)) * Math.cos(this.degToRad(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private generateRouteId(): string {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Exporter l'instance singleton
export const freeRoutingService = new OpenStreetMapRoutingService();

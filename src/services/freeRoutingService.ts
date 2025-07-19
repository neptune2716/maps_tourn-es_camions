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
      // Vérifier que tous les emplacements ont des coordonnées
      const missingCoordinates = request.locations.filter(loc => !loc.coordinates);
      if (missingCoordinates.length > 0) {
        throw new Error(
          `Les emplacements suivants n'ont pas de coordonnées : ${missingCoordinates.map(loc => loc.address).join(', ')}`
        );
      }

      if (request.locations.length < 2) {
        throw new Error('Au moins 2 emplacements sont requis pour calculer un trajet');
      }

      // Tous les emplacements ont des coordonnées, procéder à l'optimisation
      const optimizedLocations = await this.optimizeLocationOrder(
        request.locations,
        request.optimizationMethod,
        request.isLoop,
        request.vehicleType
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

      // Log optimization results for debugging
      console.log(`🚗 Route optimization complete:`, {
        vehicleType: request.vehicleType,
        method: request.optimizationMethod,
        isLoop: request.isLoop,
        totalDistance: route.totalDistance.toFixed(1) + 'km',
        totalDuration: Math.round(route.totalDuration) + 'min',
        locationsOrder: optimizedLocations.map(loc => loc.address.substring(0, 30) + '...')
      });

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

  private async optimizeLocationOrder(
    locations: Location[],
    method: OptimizationMethod,
    isLoop: boolean,
    vehicleType: VehicleType
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

    // Pour des performances optimales avec l'API, utiliser une approche hybride
    let optimized: Location[];
    
    if (unlockedLocations.length <= 8) {
      // Pour peu d'emplacements, utiliser un algorithme plus sophistiqué
      optimized = await this.advancedOptimization(unlockedLocations, method, isLoop, vehicleType);
    } else {
      // Pour beaucoup d'emplacements, utiliser l'algorithme du plus proche voisin amélioré
      optimized = await this.nearestNeighborOptimization(unlockedLocations, method);
    }

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

  private async advancedOptimization(
    locations: Location[],
    method: OptimizationMethod,
    isLoop: boolean,
    vehicleType: VehicleType
  ): Promise<Location[]> {
    if (locations.length <= 1) return locations;

    // Essayer plusieurs permutations et garder la meilleure
    const maxPermutations = Math.min(this.factorial(locations.length), 120); // Limiter pour les performances
    let bestOrder = locations;
    let bestScore = Infinity;

    // Commencer par l'algorithme du plus proche voisin
    const nearestNeighborResult = await this.nearestNeighborOptimization(locations, method);
    const nearestScore = await this.calculateOrderScore(nearestNeighborResult, method, isLoop, vehicleType);
    
    if (nearestScore < bestScore) {
      bestScore = nearestScore;
      bestOrder = nearestNeighborResult;
    }

    // Essayer quelques permutations supplémentaires pour les petits ensembles
    if (locations.length <= 6) {
      const permutations = this.generatePermutations(locations, Math.min(maxPermutations, 20));
      
      for (const permutation of permutations) {
        const score = await this.calculateOrderScore(permutation, method, isLoop, vehicleType);
        if (score < bestScore) {
          bestScore = score;
          bestOrder = permutation;
        }
      }
    }

    return bestOrder;
  }

  private async calculateOrderScore(
    locations: Location[],
    method: OptimizationMethod,
    isLoop: boolean,
    vehicleType: VehicleType = 'car'
  ): Promise<number> {
    let totalScore = 0;

    // Calculate actual route segments for more accurate scoring
    for (let i = 0; i < locations.length - 1; i++) {
      const from = locations[i];
      const to = locations[i + 1];
      
      if (!from.coordinates || !to.coordinates) continue;

      try {
        // For small route sets, use actual API calls for precise optimization
        const segment = await this.calculateSegment(from, to, vehicleType);
        
        if (method === 'shortest_distance') {
          totalScore += segment.distance;
        } else if (method === 'fastest_time') {
          totalScore += segment.duration;
        } else { // balanced
          // Balanced approach: 40% distance, 60% time
          totalScore += segment.distance * 0.4 + segment.duration * 0.6;
        }
      } catch (error) {
        // Fallback to Haversine distance calculation
        const distance = this.calculateDistance(from.coordinates, to.coordinates);
        
        if (method === 'shortest_distance') {
          totalScore += distance;
        } else if (method === 'fastest_time') {
          const estimatedSpeed = vehicleType === 'truck' ? 50 : 65;
          totalScore += (distance / estimatedSpeed) * 60;
        } else { // balanced
          const estimatedSpeed = vehicleType === 'truck' ? 55 : 60;
          const time = (distance / estimatedSpeed) * 60;
          totalScore += distance * 0.4 + time * 0.6;
        }
      }
    }

    // Add return leg cost for loop routes
    if (isLoop && locations.length > 1) {
      const first = locations[0];
      const last = locations[locations.length - 1];
      
      if (first.coordinates && last.coordinates) {
        try {
          const returnSegment = await this.calculateSegment(last, first, vehicleType);
          
          if (method === 'shortest_distance') {
            totalScore += returnSegment.distance;
          } else if (method === 'fastest_time') {
            totalScore += returnSegment.duration;
          } else {
            totalScore += returnSegment.distance * 0.4 + returnSegment.duration * 0.6;
          }
        } catch (error) {
          // Fallback calculation
          const returnDistance = this.calculateDistance(last.coordinates, first.coordinates);
          
          if (method === 'shortest_distance') {
            totalScore += returnDistance;
          } else if (method === 'fastest_time') {
            const estimatedSpeed = vehicleType === 'truck' ? 50 : 65;
            totalScore += (returnDistance / estimatedSpeed) * 60;
          } else {
            const estimatedSpeed = vehicleType === 'truck' ? 55 : 60;
            const time = (returnDistance / estimatedSpeed) * 60;
            totalScore += returnDistance * 0.4 + time * 0.6;
          }
        }
      }
    }

    return totalScore;
  }

  private generatePermutations<T>(arr: T[], maxCount: number): T[][] {
    const result: T[][] = [];
    
    const permute = (current: T[], remaining: T[]) => {
      if (result.length >= maxCount) return;
      
      if (remaining.length === 0) {
        result.push([...current]);
        return;
      }

      for (let i = 0; i < remaining.length; i++) {
        const next = remaining[i];
        const newRemaining = remaining.filter((_, index) => index !== i);
        permute([...current, next], newRemaining);
      }
    };

    permute([], arr);
    return result.slice(0, maxCount);
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
      let bestScore = Infinity;

      for (const location of locations) {
        if (visited.has(location.id) || !location.coordinates || !current.coordinates) {
          continue;
        }

        let score: number;
        const distance = this.calculateDistance(current.coordinates, location.coordinates);
        
        if (method === 'shortest_distance') {
          // Purely optimize on distance
          score = distance;
        } else if (method === 'fastest_time') {
          // Optimize on estimated time - consider traffic patterns
          // Urban areas: slower, highways: faster
          const baseSpeed = 50; // km/h base speed
          // Add variation based on distance (longer distances likely use faster roads)
          const speedMultiplier = distance > 10 ? 1.3 : distance > 5 ? 1.1 : 0.8;
          const adjustedSpeed = baseSpeed * speedMultiplier;
          score = (distance / adjustedSpeed) * 60; // time in minutes
        } else { // balanced
          // Balance between distance and time with emphasis on efficiency
          const estimatedSpeed = 55; // km/h
          const time = (distance / estimatedSpeed) * 60;
          // Weight: 40% distance, 60% time (favor time slightly)
          score = distance * 0.4 + time * 0.6;
        }

        if (score < bestScore) {
          nearest = location;
          bestScore = score;
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
      // Use different profiles for different vehicle types
      // Note: OSRM public only supports 'driving', but we can simulate truck behavior
      const profile = 'driving'; // OSRM public limitation
      const coordinates = `${from.coordinates.longitude},${from.coordinates.latitude};${to.coordinates.longitude},${to.coordinates.latitude}`;
      
      const url = `${this.osrmBaseUrl}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API OSRM failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        let distance = route.distance / 1000; // Convert to kilometers
        let duration = route.duration / 60; // Convert to minutes

        // Apply vehicle-specific adjustments
        if (vehicleType === 'truck') {
          // Trucks are slower and may take longer routes
          distance *= 1.1; // 10% longer distance for truck routes (avoiding weight restrictions)
          duration *= 1.4; // 40% more time due to lower speeds and restrictions
        }

        return {
          from,
          to,
          distance,
          duration,
          instructions: route.legs[0]?.steps?.map((step: any) => 
            step.maneuver?.instruction || `Continuer pendant ${(step.distance/1000).toFixed(1)}km`
          ) || [],
          polyline: route.geometry, // Keep GeoJSON geometry
        };
      } else {
        throw new Error('Aucun trajet trouvé');
      }
    } catch (error) {
      console.error('Échec du calcul de segment, utilisation de la ligne droite:', error);
      
      // Fallback: straight line calculation with vehicle-specific speeds
      const distance = this.calculateDistance(from.coordinates, to.coordinates);
      const estimatedSpeed = vehicleType === 'truck' ? 50 : 70; // km/h - trucks slower
      const duration = (distance / estimatedSpeed) * 60; // minutes

      return {
        from,
        to,
        distance,
        duration,
        instructions: [`Parcourir ${distance.toFixed(1)}km vers ${to.address}`],
        polyline: null,
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

  private factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }
}

// Exporter l'instance singleton
export const freeRoutingService = new OpenStreetMapRoutingService();

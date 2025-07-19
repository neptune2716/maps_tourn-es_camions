export interface Location {
  id: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isLocked?: boolean;
  lockPosition?: 'start' | 'end' | 'fixed';
  order?: number;
}

export interface Route {
  id: string;
  locations: Location[];
  totalDistance: number; // in kilometers
  totalDuration: number; // in minutes
  vehicleType: VehicleType;
  isLoop: boolean;
  segments: RouteSegment[];
  optimizationMethod: OptimizationMethod;
}

export interface RouteSegment {
  from: Location;
  to: Location;
  distance: number; // in kilometers
  duration: number; // in minutes
  instructions: string[];
  polyline: any; // GeoJSON geometry object pour les vrais tracés de route
}

export type VehicleType = 'car' | 'truck';

export type OptimizationMethod = 'shortest_distance' | 'fastest_time' | 'balanced';

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: Location[];
}

export interface MapSettings {
  center: {
    latitude: number;
    longitude: number;
  };
  zoom: number;
  style: 'streets' | 'satellite' | 'terrain';
}

export interface RouteOptimizationRequest {
  locations: Location[];
  vehicleType: VehicleType;
  isLoop: boolean;
  optimizationMethod: OptimizationMethod;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

export interface RouteOptimizationResponse {
  route: Route;
  alternativeRoutes?: Route[];
  metadata: {
    calculationTime: number;
    algorithm: string;
    apiProvider: string;
  };
}

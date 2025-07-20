import { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy loading du composant de carte pour améliorer les performances initiales
const OpenStreetMapComponent = lazy(() => import('./OpenStreetMapComponent'));

interface LazyMapProps {
  route?: any;
  locations: any[];
}

export default function LazyMap({ route, locations }: LazyMapProps) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      }
    >
      <OpenStreetMapComponent 
        route={route}
        locations={locations}
      />
    </Suspense>
  );
}

import { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy loading du composant de téléchargement de fichier
const FileUpload = lazy(() => import('./FileUpload'));

interface LazyFileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationsLoaded: (locations: any[], replaceExisting: boolean) => void;
  existingLocationsCount: number;
}

export default function LazyFileUpload({ isOpen, onClose, onLocationsLoaded, existingLocationsCount }: LazyFileUploadProps) {
  if (!isOpen) return null;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-gray-600">Chargement du module d'importation...</p>
            </div>
          </div>
        </div>
      }
    >
      <FileUpload
        onClose={onClose}
        onLocationsLoaded={onLocationsLoaded}
        existingLocationsCount={existingLocationsCount}
      />
    </Suspense>
  );
}

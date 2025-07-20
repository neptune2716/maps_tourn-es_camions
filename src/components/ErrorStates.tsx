import { AlertCircle, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
  className?: string;
}

export function ErrorBoundaryFallback({ error, resetError, className = '' }: ErrorBoundaryFallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        
        <h2 className="text-lg font-semibold text-red-900 mb-2">
          Une erreur s'est produite
        </h2>
        
        <p className="text-sm text-red-700 mb-4">
          L'application a rencontré un problème inattendu. Veuillez réessayer ou actualiser la page.
        </p>
        
        <div className="bg-red-100 rounded-md p-3 mb-4">
          <p className="text-xs text-red-800 font-mono break-all">
            {error.message}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={resetError}
            className="btn-primary px-4 py-2 text-sm flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Actualiser la page
          </button>
        </div>
      </div>
    </div>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className = '' }: NetworkErrorProps) {
  return (
    <div className={`flex flex-col items-center text-center p-6 ${className}`}>
      <WifiOff className="h-12 w-12 text-gray-400 mb-4" />
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Problème de connexion
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 max-w-sm">
        Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary px-4 py-2 text-sm flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-600 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action}
    </div>
  );
}

interface LoadingErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function LoadingError({ 
  message = "Erreur de chargement", 
  onRetry, 
  className = '' 
}: LoadingErrorProps) {
  return (
    <div className={`flex flex-col items-center text-center p-6 ${className}`}>
      <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
      
      <h3 className="text-base font-medium text-gray-900 mb-2">
        {message}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Une erreur s'est produite lors du chargement des données.
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary px-4 py-2 text-sm flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </button>
      )}
    </div>
  );
}

interface ConnectionStatusProps {
  isOnline: boolean;
  className?: string;
}

export function ConnectionStatus({ isOnline, className = '' }: ConnectionStatusProps) {
  if (isOnline) {
    return null;
  }

  return (
    <div className={`bg-red-500 text-white px-4 py-2 text-sm flex items-center justify-center ${className}`}>
      <WifiOff className="h-4 w-4 mr-2" />
      <span>Connexion internet non disponible</span>
    </div>
  );
}

// Hook for online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

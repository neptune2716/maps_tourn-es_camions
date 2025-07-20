interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  height?: string;
  width?: string;
  lines?: number;
}

export default function Skeleton({ 
  className = '', 
  variant = 'text',
  height,
  width,
  lines = 1
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4',
    rectangular: 'h-12',
    circular: 'rounded-full w-12 h-12'
  };

  const style = {
    height: height || undefined,
    width: width || undefined
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components for common patterns
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 sm:p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton variant="circular" />
        <div className="flex-1">
          <Skeleton className="mb-2" />
          <Skeleton className="w-2/3" />
        </div>
      </div>
      
      <div className="space-y-3">
        <Skeleton variant="rectangular" />
        <Skeleton lines={3} />
        <div className="flex space-x-2">
          <Skeleton className="w-20 h-8" />
          <Skeleton className="w-24 h-8" />
        </div>
      </div>
    </div>
  );
}

export function MapSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-100 rounded-lg relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      
      {/* Fake zoom controls */}
      <div className="absolute top-4 right-4 bg-white rounded shadow-md p-1">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
      </div>
      
      {/* Fake markers */}
      <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-red-400 rounded-full animate-pulse" />
      <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-blue-400 rounded-full animate-pulse" />
      <div className="absolute bottom-1/3 left-1/2 w-6 h-6 bg-green-400 rounded-full animate-pulse" />
      
      {/* Loading text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white bg-opacity-90 rounded-lg p-4 shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">Chargement de la carte...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LocationListSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Skeleton variant="circular" className="w-8 h-8" />
          <div className="flex-1">
            <Skeleton className="mb-1" />
            <Skeleton className="w-3/4" />
          </div>
          <div className="flex space-x-1">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="w-8 h-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

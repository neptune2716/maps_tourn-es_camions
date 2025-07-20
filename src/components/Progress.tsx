import { useState, useEffect } from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  amber: 'bg-amber-600',
  red: 'bg-red-600'
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

export default function ProgressBar({ 
  value, 
  max = 100, 
  className = '', 
  showPercentage = false,
  color = 'blue',
  size = 'md'
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showPercentage && (
        <div className="text-xs text-gray-600 mt-1 text-center">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

interface StepProgressProps {
  steps: string[];
  currentStep: number;
  className?: string;
  showLoadingDots?: boolean;
}

// Component for animated loading dots
function LoadingDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <span className="text-blue-600">{dots}</span>;
}

export function StepProgress({ steps, currentStep, className = '', showLoadingDots = false }: StepProgressProps) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((_, index) => (
          <div key={index} className="flex items-center">
            <div 
              className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                ${index < currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : index === currentStep
                  ? 'bg-blue-100 border-blue-600 text-blue-600'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
                }
              `}
            >
              {index + 1}
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`
                  h-0.5 w-12 mx-2
                  ${index < currentStep ? 'bg-blue-600' : 'bg-gray-300'}
                `} 
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-2 text-center">
        <span className="text-sm font-medium text-gray-900">
          {steps[currentStep]}
          {showLoadingDots && <LoadingDots />}
        </span>
      </div>
    </div>
  );
}

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  title?: string;
  message: string | ReactNode;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
  actions?: ReactNode;
  className?: string;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    textColor: 'text-green-800'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    textColor: 'text-red-800'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-800'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-800'
  }
};

export default function Notification({
  type,
  title,
  message,
  onClose,
  autoClose = false,
  autoCloseDuration = 5000,
  actions,
  className = ''
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (autoClose && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 150); // Wait for fade out animation
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`
      ${config.bgColor} ${config.borderColor} border rounded-lg p-4 
      transition-all duration-150 transform
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
      ${className}
    `}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${config.iconColor} mr-3 mt-0.5 flex-shrink-0`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-medium ${config.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          
          <div className={`text-sm ${config.textColor}`}>
            {typeof message === 'string' ? (
              <p className="whitespace-pre-line">{message}</p>
            ) : (
              message
            )}
          </div>
          
          {actions && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>

        {onClose && (
          <button
            onClick={handleClose}
            className={`ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors ${config.iconColor}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Hook for managing multiple notifications
interface NotificationItem extends Omit<NotificationProps, 'onClose'> {
  id: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (notification: Omit<NotificationItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
}

// Notification container component
interface NotificationContainerProps {
  notifications: NotificationItem[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationContainer({ 
  notifications, 
  onRemove, 
  position = 'top-right' 
}: NotificationContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] space-y-2 max-w-sm w-full`}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => onRemove(notification.id)}
          autoClose={true}
        />
      ))}
    </div>
  );
}

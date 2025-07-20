import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundaryFallback } from './ErrorStates.tsx';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You could send this to an error reporting service here
    // Example: errorReportingService.captureException(error, { extra: errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }
      
      return (
        <ErrorBoundaryFallback 
          error={this.state.error} 
          resetError={this.resetError}
          className="min-h-screen"
        />
      );
    }

    return this.props.children;
  }
}

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Truck, Menu } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="p-2 bg-primary-600 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Route Optimizer
                </span>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Home
              </Link>
              <Link
                to="/optimize"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/optimize'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Route Optimizer
              </Link>
              <Link
                to="/setup"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/setup'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Setup Guide
              </Link>
            </nav>

            <div className="md:hidden">
              <button className="p-2 rounded-md text-gray-700 hover:text-primary-600">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Truck className="h-5 w-5 text-primary-600" />
              <span className="text-sm text-gray-600">
                Optimized for cars and trucks
              </span>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 Route Optimizer. Built with modern web technologies.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

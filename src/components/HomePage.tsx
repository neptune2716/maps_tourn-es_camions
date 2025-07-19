import { Link } from 'react-router-dom';
import { MapPin, Upload, Settings, Route, Clock, Fuel } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Optimize Your
          <span className="text-primary-600"> Routes</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Find the shortest and most efficient routes for cars and trucks. 
          Upload locations, customize preferences, and get optimized delivery routes instantly.
        </p>
        <Link
          to="/optimize"
          className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200"
        >
          <MapPin className="mr-2 h-5 w-5" />
          Start Optimizing Routes
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Upload className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Multiple Input Methods
          </h3>
          <p className="text-gray-600">
            Enter locations manually, use GPS coordinates, or upload CSV/Excel files with your delivery addresses.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Settings className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Vehicle Optimization
          </h3>
          <p className="text-gray-600">
            Specialized routing for cars and trucks with vehicle-specific restrictions and preferences.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Route className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Flexible Route Control
          </h3>
          <p className="text-gray-600">
            Lock specific locations in order, choose loop routes, and customize your delivery sequence.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Clock className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Time & Distance Optimization
          </h3>
          <p className="text-gray-600">
            Choose between shortest distance, fastest time, or balanced optimization algorithms.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <MapPin className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Interactive Map Visualization
          </h3>
          <p className="text-gray-600">
            See your optimized routes on an interactive map with detailed turn-by-turn directions.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Fuel className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Cost Estimation
          </h3>
          <p className="text-gray-600">
            Get estimates for fuel costs, tolls, and total trip expenses for better planning.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Add Your Locations
            </h3>
            <p className="text-gray-600">
              Enter addresses manually or upload a file with all your delivery locations.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Configure Settings
            </h3>
            <p className="text-gray-600">
              Choose your vehicle type, optimization method, and any route preferences.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get Optimized Route
            </h3>
            <p className="text-gray-600">
              Receive the most efficient route with detailed directions and cost estimates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

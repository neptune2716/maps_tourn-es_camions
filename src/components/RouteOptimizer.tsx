import { useState } from 'react';
import { Upload, MapPin, Settings2, Play } from 'lucide-react';
import { Location, VehicleType, OptimizationMethod } from '../types';

export default function RouteOptimizer() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [optimizationMethod, setOptimizationMethod] = useState<OptimizationMethod>('balanced');
  const [isLoop, setIsLoop] = useState(false);
  const [newAddress, setNewAddress] = useState('');

  const addLocation = () => {
    if (newAddress.trim()) {
      const newLocation: Location = {
        id: Math.random().toString(36).substr(2, 9),
        address: newAddress.trim(),
        order: locations.length,
      };
      setLocations([...locations, newLocation]);
      setNewAddress('');
    }
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addLocation();
    }
  };

  const optimizeRoute = () => {
    // TODO: Implement route optimization logic
    console.log('Optimizing route with:', {
      locations,
      vehicleType,
      optimizationMethod,
      isLoop
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Route Optimizer
        </h1>
        <p className="text-gray-600">
          Add your locations and customize settings to find the optimal route
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Input and Settings */}
        <div className="space-y-6">
          {/* Location Input */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Locations
            </h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter address or GPS coordinates"
                className="input-field flex-1"
              />
              <button
                onClick={addLocation}
                className="btn-primary px-6"
              >
                Add
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 min-h-[200px]">
              {locations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No locations added yet</p>
                  <p className="text-sm">Add locations above or upload a file</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locations.map((location, index) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-900">{location.address}</span>
                      </div>
                      <button
                        onClick={() => removeLocation(location.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <button className="btn-secondary w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload File (CSV, Excel)
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Settings2 className="mr-2 h-5 w-5" />
              Route Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="input-field"
                >
                  <option value="car">Car</option>
                  <option value="truck">Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimization Method
                </label>
                <select
                  value={optimizationMethod}
                  onChange={(e) => setOptimizationMethod(e.target.value as OptimizationMethod)}
                  className="input-field"
                >
                  <option value="shortest_distance">Shortest Distance</option>
                  <option value="fastest_time">Fastest Time</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="loop"
                  checked={isLoop}
                  onChange={(e) => setIsLoop(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="loop" className="ml-2 block text-sm text-gray-900">
                  Return to starting point (Loop)
                </label>
              </div>
            </div>

            <button
              onClick={optimizeRoute}
              disabled={locations.length < 2}
              className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="mr-2 h-4 w-4" />
              Optimize Route
            </button>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Route Map
          </h2>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Interactive map will appear here</p>
              <p className="text-sm">Add locations and optimize to see your route</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

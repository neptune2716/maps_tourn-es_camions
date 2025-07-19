import { MapPin, CheckCircle, Heart, Zap } from 'lucide-react';

export default function SetupGuide() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <MapPin className="mx-auto h-16 w-16 text-primary-600 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Ready to Go! 🚀
        </h1>
        <p className="text-xl text-gray-600">
          No setup required - start optimizing routes immediately with free services
        </p>
      </div>

      {/* No Setup Required */}
      <div className="card bg-green-50 border-green-200 mb-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              🎉 Everything Works Out of the Box!
            </h3>
            <p className="text-green-700 mb-4">
              This application uses 100% free services. No API keys, no credit cards, no setup required!
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-800 mb-2">✅ What's Included:</h4>
                <ul className="text-green-700 space-y-1">
                  <li>• Interactive OpenStreetMap</li>
                  <li>• French address autocomplete</li>
                  <li>• Accent normalization (é→e, œ→oe)</li>
                  <li>• Real-time route optimization</li>
                  <li>• GPS coordinate retrieval</li>
                  <li>• Vehicle-specific routing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-2">🆓 Free Services Used:</h4>
                <ul className="text-green-700 space-y-1">
                  <li>• OpenStreetMap (mapping)</li>
                  <li>• Nominatim (geocoding)</li>
                  <li>• OSRM (route calculation)</li>
                  <li>• Leaflet (map display)</li>
                  <li>• No usage limits for normal use</li>
                  <li>• No account registration needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Guide</h2>
        
        {/* Step 1 */}
        <div className="card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start Adding Locations
              </h3>
              <p className="text-gray-600 mb-4">
                Click "Ajouter une adresse" and start typing any French address or location.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">Try these examples:</p>
                <div className="space-y-1 text-sm">
                  <code className="bg-white px-2 py-1 rounded border block">Tour Eiffel</code>
                  <code className="bg-white px-2 py-1 rounded border block">allee du clos masnil, olivet</code>
                  <code className="bg-white px-2 py-1 rounded border block">61 rue république, ly</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select From Suggestions
              </h3>
              <p className="text-gray-600 mb-4">
                Our smart autocomplete will show relevant addresses as you type. GPS coordinates are automatically retrieved.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>French accents handled automatically</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Optimize Your Route
              </h3>
              <p className="text-gray-600 mb-4">
                Add multiple locations, then click "Optimiser le parcours" to find the shortest route. View results on the interactive map.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="mt-12 card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          🌟 Advanced Features Available
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <h4 className="font-semibold mb-2">🎯 Smart Address Input</h4>
            <ul className="space-y-1 text-sm">
              <li>• Real-time French suggestions</li>
              <li>• Partial city name matching</li>
              <li>• Accent normalization</li>
              <li>• Keyboard navigation support</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🗺️ Route Optimization</h4>
            <ul className="space-y-1 text-sm">
              <li>• Shortest distance calculation</li>
              <li>• Interactive map display</li>
              <li>• Vehicle-specific routing</li>
              <li>• Multiple location support</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-2 text-sm text-blue-600">
          <Heart className="h-4 w-4 text-red-500" />
          <span>Built for French users with love using 100% free services</span>
        </div>
      </div>

      {/* Development Info */}
      <div className="mt-8 card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔧 For Developers
        </h3>
        <p className="text-gray-600 mb-4">
          Want to contribute or run this locally? Here's what you need:
        </p>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4">
          <pre className="text-sm">
{`# Clone and install
git clone <repository-url>
cd maps_tournées_camions
npm install

# Start development server
npm run dev

# No environment variables needed! 🎉`}
          </pre>
        </div>
        <p className="text-sm text-gray-600">
          See README.md for complete development setup and architecture details.
        </p>
      </div>
    </div>
  );
}

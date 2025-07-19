import { ExternalLink, Key, MapPin, CheckCircle } from 'lucide-react';

export default function SetupGuide() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <MapPin className="mx-auto h-16 w-16 text-primary-600 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Setup Your Route Optimizer
        </h1>
        <p className="text-xl text-gray-600">
          Get your free API key to start optimizing routes with interactive maps
        </p>
      </div>

      {/* Step-by-step guide */}
      <div className="space-y-8">
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
                Create a Free Mapbox Account
              </h3>
              <p className="text-gray-600 mb-4">
                Mapbox provides free maps and routing for up to 50,000 requests per month.
              </p>
              <a 
                href="https://account.mapbox.com/auth/signup/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Sign Up for Mapbox
              </a>
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
                Get Your Access Token
              </h3>
              <p className="text-gray-600 mb-4">
                After signing up, you'll find your default public token in your account dashboard.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">Your token will look like this:</p>
                <code className="text-xs bg-white px-2 py-1 rounded border">
                  pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZjR0ZXh0eDAzYXkzcm1ldGlseGppN3kifQ...
                </code>
              </div>
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Key className="mr-2 h-4 w-4" />
                Get Access Token
              </a>
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
                Configure Environment Variables
              </h3>
              <p className="text-gray-600 mb-4">
                Add your token to the project's environment file.
              </p>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4 overflow-x-auto">
                <p className="text-sm text-gray-300 mb-2">Edit .env.local file:</p>
                <pre className="text-sm">
{`# Replace 'your_mapbox_token_here' with your actual token
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIi...

# Other settings (optional)
VITE_APP_ENV=development
VITE_ENABLE_TRUCK_ROUTING=true
VITE_ENABLE_FILE_UPLOAD=true`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="card">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Restart the Development Server
              </h3>
              <p className="text-gray-600 mb-4">
                After adding your token, restart the server to load the new environment variables.
              </p>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4">
                <code className="text-sm">npm run dev</code>
              </div>
            </div>
          </div>
        </div>

        {/* Success */}
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                You're All Set! 🎉
              </h3>
              <p className="text-green-700 mb-4">
                Once configured, you'll have access to:
              </p>
              <ul className="text-green-700 space-y-1">
                <li>• Interactive maps with custom markers</li>
                <li>• Real-time route optimization</li>
                <li>• Address geocoding and validation</li>
                <li>• Vehicle-specific routing</li>
                <li>• Turn-by-turn directions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Options */}
      <div className="mt-12 card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Alternative: Use Without Maps (Limited Functionality)
        </h3>
        <p className="text-blue-700 mb-4">
          You can still test the route optimization logic without maps:
        </p>
        <ul className="text-blue-700 space-y-1 mb-4">
          <li>• Add locations with GPS coordinates</li>
          <li>• Test optimization algorithms</li>
          <li>• View route calculations and distances</li>
          <li>• Export results</li>
        </ul>
        <p className="text-sm text-blue-600">
          Note: Address geocoding and visual map display require a Mapbox token.
        </p>
      </div>
    </div>
  );
}

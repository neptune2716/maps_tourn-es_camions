import { Link } from 'react-router-dom';
import { MapPin, Upload, Settings, Route, Clock, Fuel } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Optimisez Vos
          <span className="text-primary-600"> Trajets</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Trouvez les trajets les plus courts et les plus efficaces pour voitures et camions. 
          Importez des emplacements, personnalisez vos préférences et obtenez des trajets optimisés instantanément.
        </p>
        <Link
          to="/optimize"
          className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200"
        >
          <MapPin className="mr-2 h-5 w-5" />
          Commencer l'Optimisation
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Upload className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Méthodes de Saisie Multiples
          </h3>
          <p className="text-gray-600">
            Saisissez des emplacements manuellement, utilisez des coordonnées GPS, ou importez des fichiers CSV/Excel avec vos adresses de livraison.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Settings className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Optimisation par Véhicule
          </h3>
          <p className="text-gray-600">
            Calcul d'itinéraires spécialisé pour voitures et camions avec restrictions et préférences spécifiques au véhicule.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Route className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Contrôle Flexible des Trajets
          </h3>
          <p className="text-gray-600">
            Verrouillez des emplacements spécifiques dans l'ordre, choisissez des trajets en boucle, et personnalisez votre séquence de livraison.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Clock className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Optimisation Temps et Distance
          </h3>
          <p className="text-gray-600">
            Choisissez entre distance la plus courte, temps le plus rapide, ou algorithmes d'optimisation équilibrés.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <MapPin className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Visualisation Carte Interactive
          </h3>
          <p className="text-gray-600">
            Visualisez vos trajets optimisés sur une carte interactive avec des directions détaillées étape par étape.
          </p>
        </div>

        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Fuel className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Estimation des Coûts
          </h3>
          <p className="text-gray-600">
            Obtenez des estimations des coûts de carburant, péages, et dépenses totales du voyage pour une meilleure planification.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Comment Ça Marche
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ajoutez Vos Emplacements
            </h3>
            <p className="text-gray-600">
              Saisissez des adresses manuellement ou importez un fichier avec tous vos emplacements de livraison.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Configurez les Paramètres
            </h3>
            <p className="text-gray-600">
              Choisissez votre type de véhicule, méthode d'optimisation, et toutes préférences de trajet.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-xl font-bold mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Obtenez le Trajet Optimisé
            </h3>
            <p className="text-gray-600">
              Recevez le trajet le plus efficace avec des directions détaillées et des estimations de coûts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  type: string;
  importance: number;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
    state?: string;
    county?: string;
  };
}

export function useAddressSearch() {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour normaliser les accents et caractères spéciaux français
  const normalizeText = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD') // Décomposer les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les diacritiques
      .replace(/œ/g, 'oe') // Remplacer œ par oe
      .replace(/æ/g, 'ae') // Remplacer æ par ae
      .replace(/ç/g, 'c')  // Remplacer ç par c
      .trim();
  }, []);

  const searchAddresses = useCallback(async (query: string, countryCode = 'FR') => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Améliorer le parsing de la requête pour différents formats
      // Normaliser la requête pour gérer les accents
      const normalizedQuery = query; // Garder la requête originale pour l'API
      let searchQuery = normalizedQuery;
      let isStructuredQuery = false;
      let searchParams = new URLSearchParams();
      
      // Si la requête contient une virgule, traiter comme une requête structurée
      if (query.includes(',')) {
        const parts = query.split(',').map(part => part.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const streetPart = parts[0];
          const cityPart = parts[1];
          
          // Pour les villes partielles, utiliser une recherche normale plus flexible
          // au lieu de la recherche structurée stricte
          if (cityPart.length < 4) {
            // Ville trop courte, utiliser recherche normale
            searchQuery = parts.join(' ');
          } else {
            // Essayer d'abord une recherche structurée
            isStructuredQuery = true;
            searchParams.append('format', 'json');
            searchParams.append('street', streetPart);
            searchParams.append('city', cityPart + '*'); // Ajout du wildcard pour la ville partielle
            searchParams.append('countrycodes', countryCode);
            searchParams.append('limit', '10');
            searchParams.append('addressdetails', '1');
            searchParams.append('dedupe', '1');
            searchParams.append('extratags', '1');
          }
          
          // Toujours préparer la recherche de fallback
          searchQuery = parts.join(' ');
        }
      }
      
      let url;
      if (isStructuredQuery) {
        url = `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`;
      } else {
        const encodedQuery = encodeURIComponent(searchQuery);
        url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=${countryCode}&limit=12&addressdetails=1&dedupe=1&extratags=1`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RouteOptimizer/1.0.0 (https://github.com/yourproject/route-optimizer)',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur de recherche: ${response.statusText}`);
      }

      let data: AddressSuggestion[] = await response.json();
      
      // Pour TOUTES les requêtes (avec ou sans virgule), essayer des recherches additionnelles si peu de résultats
      if (data.length < 5) {
        const additionalSearches = [];
        
        if (query.includes(',')) {
          // Requêtes avec virgule - variantes déjà implémentées
          const parts = query.split(',').map(part => part.trim());
          const streetPart = parts[0];
          const cityPart = parts[1];
          
          additionalSearches.push(
            `${streetPart} ${cityPart}`,
            `${streetPart} ${cityPart}*`,
            `${streetPart}, ${cityPart}*`
          );
        } else {
          // Requêtes sans virgule - ajouter des variantes pour améliorer les résultats
          additionalSearches.push(
            `${query}*`, // Avec wildcard
            `${query} France`, // Avec le pays
            query.split(' ').filter(word => word.length > 2).join(' '), // Mots significatifs seulement
            normalizeText(query), // Version normalisée sans accents
            `${normalizeText(query)}*` // Version normalisée avec wildcard
          );
        }
        
        for (const variant of additionalSearches) {
          if (data.length >= 8) break; // Arrêter si on a assez de résultats
          
          try {
            const variantQuery = encodeURIComponent(variant);
            const variantUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${variantQuery}&countrycodes=${countryCode}&limit=6&addressdetails=1&dedupe=1`;
            
            const variantResponse = await fetch(variantUrl, {
              headers: {
                'User-Agent': 'RouteOptimizer/1.0.0 (https://github.com/yourproject/route-optimizer)',
              },
            });
            
            if (variantResponse.ok) {
              const variantData: AddressSuggestion[] = await variantResponse.json();
              // Ajouter les nouveaux résultats en évitant les doublons
              variantData.forEach(item => {
                if (!data.find(existing => existing.place_id === item.place_id)) {
                  data.push(item);
                }
              });
            }
          } catch (error) {
            console.warn(`Variant search failed for "${variant}":`, error);
          }
        }
      }      // Filtrer et trier les résultats avec une meilleure logique
      const filteredData = data
        .filter(item => {
          // Filtrer les résultats non pertinents
          if (!item.display_name || !item.lat || !item.lon) return false;
          
          // Si la requête originale contient une virgule, être plus strict dans le matching
          if (query.includes(',')) {
            const parts = query.split(',').map(part => normalizeText(part.trim())).filter(Boolean);
            const streetPart = parts[0];
            const cityPart = parts[1];
            
            const displayLower = normalizeText(item.display_name);
            const addressParts = [
              item.address.house_number,
              item.address.road,
              item.address.city,
              item.address.town,
              item.address.village
            ].filter(Boolean).map(part => normalizeText(part!));
            
            // Vérifier la correspondance de la rue
            const streetMatch = streetPart.split(' ').some(word => 
              displayLower.includes(word) || 
              addressParts.some(part => part.includes(word))
            );
            
            // Vérifier la correspondance de la ville (partielle OK)
            const cityMatch = displayLower.includes(cityPart) ||
              addressParts.some(part => part.includes(cityPart) || part.startsWith(cityPart)) ||
              (item.address.city && normalizeText(item.address.city).startsWith(cityPart)) ||
              (item.address.town && normalizeText(item.address.town).startsWith(cityPart)) ||
              (item.address.village && normalizeText(item.address.village).startsWith(cityPart));
            
            // Accepter si la rue ET la ville matchent (même partiellement)
            return streetMatch && cityMatch;
          } else {
            // Pour les requêtes sans virgule, être plus permissif
            const queryWords = normalizeText(query).split(' ').filter(word => word.length > 1);
            const displayLower = normalizeText(item.display_name);
            const addressText = [
              item.address.house_number,
              item.address.road,
              item.address.city,
              item.address.town,
              item.address.village
            ].filter(Boolean).map(part => normalizeText(part!)).join(' ');
            
            // Au moins 60% des mots de la requête doivent être trouvés
            const matchingWords = queryWords.filter(word => 
              displayLower.includes(word) || 
              addressText.includes(word) ||
              // Recherche partielle pour les mots plus longs
              (word.length > 3 && (displayLower.includes(word.substring(0, 4)) || addressText.includes(word.substring(0, 4))))
            );
            
            return matchingWords.length >= Math.ceil(queryWords.length * 0.6);
          }
        })
        .sort((a, b) => {
          // Priorité 1: Correspondance avec requête structurée (avec virgule)
          if (query.includes(',')) {
            const parts = query.split(',').map(part => normalizeText(part.trim()));
            const streetPart = parts[0];
            const cityPart = parts[1];
            
            // Calculer le score de correspondance pour A
            const aStreetScore = streetPart.split(' ').filter(word => 
              normalizeText(a.display_name).includes(word) ||
              (a.address.road && normalizeText(a.address.road).includes(word))
            ).length;
            
            const aCityScore = (a.address.city && normalizeText(a.address.city).startsWith(cityPart)) ? 2 :
                             (a.address.town && normalizeText(a.address.town).startsWith(cityPart)) ? 2 :
                             (a.address.village && normalizeText(a.address.village).startsWith(cityPart)) ? 2 :
                             normalizeText(a.display_name).includes(cityPart) ? 1 : 0;
            
            const aScore = aStreetScore + aCityScore;
            
            // Calculer le score de correspondance pour B
            const bStreetScore = streetPart.split(' ').filter(word => 
              normalizeText(b.display_name).includes(word) ||
              (b.address.road && normalizeText(b.address.road).includes(word))
            ).length;
            
            const bCityScore = (b.address.city && normalizeText(b.address.city).startsWith(cityPart)) ? 2 :
                             (b.address.town && normalizeText(b.address.town).startsWith(cityPart)) ? 2 :
                             (b.address.village && normalizeText(b.address.village).startsWith(cityPart)) ? 2 :
                             normalizeText(b.display_name).includes(cityPart) ? 1 : 0;
            
            const bScore = bStreetScore + bCityScore;
            
            if (aScore !== bScore) return bScore - aScore;
          } else {
            // Pour les requêtes sans virgule, compter les mots correspondants
            const queryWords = normalizeText(query).split(' ').filter(word => word.length > 1);
            
            const aMatches = queryWords.filter(word => 
              normalizeText(a.display_name).includes(word) ||
              (a.address.road && normalizeText(a.address.road).includes(word)) ||
              (a.address.city && normalizeText(a.address.city).includes(word))
            ).length;
            
            const bMatches = queryWords.filter(word => 
              normalizeText(b.display_name).includes(word) ||
              (b.address.road && normalizeText(b.address.road).includes(word)) ||
              (b.address.city && normalizeText(b.address.city).includes(word))
            ).length;
            
            if (aMatches !== bMatches) return bMatches - aMatches;
          }
          
          // Priorité 2: Correspondance générale avec la requête
          const queryLower = normalizeText(query);
          const aMatch = normalizeText(a.display_name).includes(queryLower);
          const bMatch = normalizeText(b.display_name).includes(queryLower);
          
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          
          // Priorité 3: Importance de Nominatim
          return b.importance - a.importance;
        })
        .slice(0, 8); // Limiter à 8 résultats

      setSuggestions(filteredData);
    } catch (err) {
      console.error('Erreur de recherche d\'adresses:', err);
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchAddresses,
    clearSuggestions,
  };
}

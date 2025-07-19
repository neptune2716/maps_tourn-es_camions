import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, X, Plus, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Location } from '../types/index.ts';

interface FileUploadProps {
  onLocationsLoaded: (locations: Location[], replaceExisting: boolean) => void;
  onClose: () => void;
  existingLocationsCount: number;
}

interface ParsedLocation {
  address?: string;
  adresse?: string;
  location?: string;
  lieu?: string;
  name?: string;
  nom?: string;
  latitude?: number;
  lat?: number;
  y?: number;
  longitude?: number;
  lng?: number;
  lon?: number;
  x?: number;
  description?: string;
  [key: string]: any; // Pour permettre d'autres propriétés dynamiques
}

export default function FileUpload({ onLocationsLoaded, onClose, existingLocationsCount }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Location[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let data: ParsedLocation[] = [];

      if (fileExtension === 'csv') {
        data = await parseCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        data = await parseExcel(file);
      } else if (fileExtension === 'json') {
        data = await parseJSON(file);
      } else {
        throw new Error('Format de fichier non supporté. Utilisez CSV, Excel (.xlsx/.xls) ou JSON.');
      }

      const locations = convertToLocations(data);
      setPreview(locations);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du traitement du fichier');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const parseCSV = (file: File): Promise<ParsedLocation[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`Erreur CSV: ${results.errors[0].message}`));
          } else {
            resolve(results.data as ParsedLocation[]);
          }
        },
        error: (error) => reject(new Error(`Erreur de lecture CSV: ${error.message}`))
      });
    });
  };

  const parseExcel = async (file: File): Promise<ParsedLocation[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('Le fichier Excel doit contenir au moins une ligne d\'en-tête et une ligne de données.'));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const parsedData = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Erreur de lecture Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseJSON = (file: File): Promise<ParsedLocation[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (Array.isArray(data)) {
            resolve(data);
          } else {
            reject(new Error('Le fichier JSON doit contenir un tableau d\'objets.'));
          }
        } catch (error) {
          reject(new Error('Format JSON invalide.'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier JSON'));
      reader.readAsText(file);
    });
  };

  const convertToLocations = (data: ParsedLocation[]): Location[] => {
    return data.map((item, index) => {
      // Essayer de détecter les colonnes automatiquement
      const address = item.address || item.adresse || item.location || item.lieu || item.name || item.nom || '';
      const lat = item.latitude || item.lat || item.y || undefined;
      const lng = item.longitude || item.lng || item.lon || item.x || undefined;

      if (!address && (!lat || !lng)) {
        throw new Error(`Ligne ${index + 1}: Une adresse ou des coordonnées (latitude/longitude) sont requises.`);
      }

      const location: Location = {
        id: `upload_${Date.now()}_${index}`,
        address: address || `Coordonnées ${lat}, ${lng}`,
        order: index,
      };

      if (lat !== undefined && lng !== undefined) {
        location.coordinates = {
          latitude: typeof lat === 'number' ? lat : parseFloat(lat as string),
          longitude: typeof lng === 'number' ? lng : parseFloat(lng as string),
        };
      }

      return location;
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleConfirmUpload = () => {
    onLocationsLoaded(preview, importMode === 'replace');
    onClose();
  };

  const handleRetry = () => {
    setShowPreview(false);
    setError(null);
    setPreview([]);
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Aperçu des emplacements</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-4">
            <div className="text-sm text-gray-600 mb-2">
              {preview.length} emplacement(s) détecté(s)
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {preview.map((location, index) => (
                <div key={location.id} className="flex items-center p-2 bg-gray-50 rounded">
                  <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{location.address}</div>
                    {location.coordinates && (
                      <div className="text-xs text-gray-500">
                        {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import Mode Selection */}
          {existingLocationsCount > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm font-medium text-amber-800 mb-3">
                Vous avez déjà {existingLocationsCount} emplacement(s) dans votre liste.
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value as 'replace' | 'append')}
                    className="mr-2"
                  />
                  <RefreshCw className="h-4 w-4 mr-2 text-red-600" />
                  <span className="text-sm">
                    <strong>Remplacer</strong> - Supprimer tous les emplacements existants et utiliser uniquement ceux du fichier
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={(e) => setImportMode(e.target.value as 'replace' | 'append')}
                    className="mr-2"
                  />
                  <Plus className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm">
                    <strong>Ajouter</strong> - Conserver les emplacements existants et ajouter ceux du fichier
                  </span>
                </label>
              </div>
              <div className="text-xs text-amber-700 mt-2">
                {importMode === 'replace' 
                  ? `Résultat: ${preview.length} emplacements au total`
                  : `Résultat: ${existingLocationsCount + preview.length} emplacements au total`
                }
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handleRetry}
              className="btn-secondary"
            >
              Charger un autre fichier
            </button>
            <div className="space-x-2">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmUpload}
                className="btn-primary"
              >
                Confirmer ({preview.length} emplacements)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Importer des emplacements</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isProcessing ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Traitement du fichier...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">
                {isDragActive
                  ? 'Déposez le fichier ici...'
                  : 'Glissez-déposez un fichier ici ou cliquez pour sélectionner'}
              </p>
              <p className="text-xs text-gray-500">
                Formats supportés: CSV, Excel (.xlsx, .xls), JSON
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Format attendu:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>CSV/Excel:</strong> Colonnes: address/adresse, latitude (optionnel), longitude (optionnel)</p>
            <p><strong>JSON:</strong> Array d'objets avec propriétés address, latitude, longitude</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <FileText className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Exemple CSV:</p>
              <code className="block bg-white p-2 rounded text-xs">
                address,latitude,longitude<br/>
                "Tour Eiffel, Paris",48.8584,2.2945<br/>
                "Arc de Triomphe, Paris",,<br/>
                "Louvre, Paris",48.8606,2.3376
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

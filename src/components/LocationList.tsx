import { useState, useRef } from 'react';
import { Lock, LockOpen, GripVertical, X, Edit, MapPin, AlertTriangle } from 'lucide-react';
import { Location } from '../types/index.ts';
import AddressAutocomplete from './AddressAutocomplete.tsx';
import { AddressSuggestion } from '../hooks/useAddressSearch.ts';

interface LocationListProps {
  locations: Location[];
  onLocationUpdate: (locations: Location[]) => void;
  onLocationEdit: (id: string, newAddress: string, coordinates?: { latitude: number; longitude: number }) => void;
  onLocationDelete: (id: string) => void;
  onLocationLock: (id: string) => void;
}

interface DragState {
  draggedIndex: number | null;
  dragOverIndex: number | null;
}

export default function LocationList({
  locations,
  onLocationUpdate,
  onLocationEdit,
  onLocationDelete,
  onLocationLock
}: LocationListProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedIndex: null,
    dragOverIndex: null
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const dragCounterRef = useRef(0);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragState(prev => ({ ...prev, draggedIndex: index }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Style visuel pour l'élément traîné
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDragState({ draggedIndex: null, dragOverIndex: null });
    dragCounterRef.current = 0;
    
    // Restaurer l'opacité
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    setDragState(prev => ({ ...prev, dragOverIndex: index }));
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounterRef.current++;
    setDragState(prev => ({ ...prev, dragOverIndex: index }));
  };

  const handleDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragState(prev => ({ ...prev, dragOverIndex: null }));
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragState.draggedIndex;
    
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragState({ draggedIndex: null, dragOverIndex: null });
      return;
    }

    // Vérifier si les emplacements peuvent être déplacés (pas verrouillés)
    const draggedLocation = locations[dragIndex];
    const targetLocation = locations[dropIndex];
    
    if (draggedLocation.isLocked || targetLocation.isLocked) {
      setDragState({ draggedIndex: null, dragOverIndex: null });
      return;
    }

    // Créer une nouvelle liste avec l'ordre modifié
    const newLocations = [...locations];
    const [movedLocation] = newLocations.splice(dragIndex, 1);
    newLocations.splice(dropIndex, 0, movedLocation);
    
    // Mettre à jour les indices d'ordre
    const updatedLocations = newLocations.map((loc, index) => ({
      ...loc,
      order: index
    }));

    onLocationUpdate(updatedLocations);
    setDragState({ draggedIndex: null, dragOverIndex: null });
    dragCounterRef.current = 0;
  };

  const startEdit = (location: Location) => {
    setEditingId(location.id);
    setEditValue(location.address);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      onLocationEdit(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const saveEditFromSuggestion = (suggestion: AddressSuggestion) => {
    if (editingId) {
      // Sauvegarder avec les coordonnées de la suggestion
      onLocationEdit(editingId, suggestion.display_name, {
        latitude: parseFloat(suggestion.lat),
        longitude: parseFloat(suggestion.lon),
      });
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  if (locations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>Aucun emplacement ajouté</p>
        <p className="text-sm">Ajoutez des emplacements ci-dessus ou importez un fichier</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Status indicator */}
      <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <GripVertical className="h-3 w-3 mr-1" />
          Glissez-déposez pour réorganiser
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-600">
            ✓ {locations.filter(loc => loc.coordinates).length} géocodée(s)
          </span>
          {locations.some(loc => !loc.coordinates) && (
            <span className="text-amber-600">
              ⚠ {locations.filter(loc => !loc.coordinates).length} à résoudre
            </span>
          )}
        </div>
      </div>
      
      {locations.map((location, index) => {
        const isDragging = dragState.draggedIndex === index;
        const isDragOver = dragState.dragOverIndex === index;
        const isEditing = editingId === location.id;
        
        return (
          <div
            key={location.id}
            draggable={!location.isLocked && !isEditing}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              flex items-center p-3 rounded-lg border transition-all duration-200
              ${isDragging ? 'opacity-50 scale-95' : ''}
              ${isDragOver ? 'border-blue-400 bg-blue-50 transform scale-105' : 
                !location.coordinates ? 'border-amber-200 bg-amber-50' :
                location.isLocked ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}
              ${!location.isLocked && !isEditing ? 'cursor-move hover:bg-gray-100' : ''}
            `}
          >
            {/* Drag Handle & Order Number */}
            <div className="flex items-center mr-3">
              {!location.isLocked && !isEditing && (
                <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
              )}
              <span className={`
                w-6 h-6 text-white text-xs rounded-full flex items-center justify-center font-medium
                ${location.isLocked ? 'bg-red-600' : 'bg-blue-600'}
              `}>
                {index + 1}
              </span>
            </div>

            {/* Address Display/Edit */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="relative">
                  <AddressAutocomplete
                    value={editValue}
                    onChange={setEditValue}
                    onSelect={saveEditFromSuggestion}
                    onEscape={cancelEdit}
                    onEnterWithoutSelection={saveEdit}
                    placeholder="Modifier l'adresse..."
                    className="w-full text-sm"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Entrée pour sauvegarder • Échap pour annuler
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900 block truncate">
                      {location.address}
                    </span>
                    {!location.coordinates && (
                      <div className="relative group">
                        <AlertTriangle className="h-4 w-4 text-amber-500 ml-2 flex-shrink-0" />
                        <div className="absolute bottom-6 left-0 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Adresse non géocodée
                        </div>
                      </div>
                    )}
                  </div>
                  {location.coordinates ? (
                    <div className="text-xs text-gray-500">
                      📍 {location.coordinates.latitude.toFixed(4)}, {location.coordinates.longitude.toFixed(4)}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600 flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Adresse non trouvée
                      </div>
                      <button
                        onClick={() => startEdit(location)}
                        className="text-blue-600 hover:text-blue-800 underline text-xs ml-2"
                      >
                        Résoudre
                      </button>
                    </div>
                  )}
                  {location.isLocked && (
                    <div className="text-xs text-red-600 flex items-center mt-1">
                      <Lock className="h-3 w-3 mr-1" />
                      Position verrouillée
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => startEdit(location)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Modifier l'adresse"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => onLocationLock(location.id)}
                    className={`p-1 transition-colors ${
                      location.isLocked 
                        ? 'text-red-600 hover:text-red-800' 
                        : 'text-gray-400 hover:text-orange-600'
                    }`}
                    title={location.isLocked ? 'Déverrouiller la position' : 'Verrouiller la position'}
                  >
                    {location.isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => onLocationDelete(location.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer cet emplacement"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Instructions */}
      <div className="text-xs text-gray-400 italic mt-3">
        💡 Astuce: Verrouillez un emplacement pour le fixer à sa position actuelle lors de l'optimisation
      </div>
    </div>
  );
}

import { PatternPreset, SpirographParams, SavedSpirographParams } from '../types';

const STORAGE_KEY = 'cosmic_spirograph_presets';

export const getStoredPresets = (): PatternPreset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error('Failed to load presets', e);
    return [];
  }
};

export const saveStoredPreset = (name: string, params: SpirographParams): PatternPreset[] => {
  const presets = getStoredPresets();
  
  // Explicitly construct SavedSpirographParams to exclude speed and avoid unused variable errors
  const paramsToSave: SavedSpirographParams = {
    R: params.R,
    r: params.r,
    d: params.d,
    color: params.color,
    mode: params.mode,
    shape: params.shape,
    resolution: params.resolution,
    strokeWidth: params.strokeWidth,
    elongation: params.elongation,
    isReverseGear: params.isReverseGear || false
  };

  const newPreset: PatternPreset = {
    id: Date.now().toString(),
    name: name.trim() || `Pattern ${new Date().toLocaleTimeString()}`,
    params: paramsToSave, 
    createdAt: Date.now()
  };
  
  const updated = [newPreset, ...presets];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteStoredPreset = (id: string): PatternPreset[] => {
  const presets = getStoredPresets();
  const updated = presets.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
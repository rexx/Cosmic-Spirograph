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
  
  // Destructure speed out, save the rest
  const { speed, ...paramsToSave } = params;

  const newPreset: PatternPreset = {
    id: Date.now().toString(),
    name: name.trim() || `Pattern ${new Date().toLocaleTimeString()}`,
    params: paramsToSave as SavedSpirographParams, 
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
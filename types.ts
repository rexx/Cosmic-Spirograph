export enum Mode {
  INNER = 'INNER', // Hypocycloid
  OUTER = 'OUTER', // Epicycloid
}

export enum Shape {
  CIRCLE = 'CIRCLE',
  SQUARE = 'SQUARE',
  TRIANGLE = 'TRIANGLE',
  STADIUM = 'STADIUM'
}

export interface SpirographParams {
  R: number; // Radius of fixed gear (or size scale)
  r: number; // Radius of moving gear
  d: number; // Distance of pen from center of moving gear (hole position)
  color: string;
  speed: number;
  mode: Mode;
  shape: Shape;
  resolution: number;
  strokeWidth: number;
  elongation: number; // For Stadium/Rectangle length scaling
}

// Params to be saved (excludes speed)
export type SavedSpirographParams = Omit<SpirographParams, 'speed'>;

export interface PatternPreset {
  id: string;
  name: string;
  params: SavedSpirographParams;
  createdAt: number;
}

export interface RandomPatternResponse {
  R: number;
  r: number;
  d: number;
  color: string;
  mode: "INNER" | "OUTER";
  shape: "CIRCLE" | "SQUARE" | "TRIANGLE" | "STADIUM";
  elongation?: number;
}

export type Language = 'en' | 'zh';
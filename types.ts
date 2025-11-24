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

export interface PatternPreset {
  name: string;
  params: Partial<SpirographParams>;
}

export interface AIPatternResponse {
  R: number;
  r: number;
  d: number;
  color: string;
  mode: "INNER" | "OUTER";
  shape: "CIRCLE" | "SQUARE" | "TRIANGLE" | "STADIUM";
  elongation?: number;
  // explanation removed as we are using local randomizer
}

export type Language = 'en' | 'zh';
import { RandomPatternResponse } from "../types";

// Helper for random number in range
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

export const generateCreativePattern = async (): Promise<RandomPatternResponse | null> => {
  // Instant generation, no delay needed

  const modes = ["INNER", "OUTER"];
  const shapes = ["CIRCLE", "SQUARE", "TRIANGLE", "STADIUM"];
  
  // Generate Random Params
  const shape = shapes[Math.floor(Math.random() * shapes.length)] as "CIRCLE" | "SQUARE" | "TRIANGLE" | "STADIUM";
  const mode = modes[Math.floor(Math.random() * modes.length)] as "INNER" | "OUTER";
  
  // Random RGB Color
  const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  
  // Randomized Geometry
  const R = randomInt(60, 140);
  const r = randomInt(10, 90);
  const d = randomInt(10, 100);
  const elongation = shape === "STADIUM" ? randomFloat(0.5, 3.0) : 2.0;

  return {
    R,
    r,
    d,
    color,
    mode,
    shape,
    elongation
  };
};
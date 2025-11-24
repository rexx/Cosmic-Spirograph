import { Shape } from '../types';

export interface ShapePoint {
  x: number;
  y: number;
  normalAngle: number; // Angle of the normal vector pointing OUT from the shape
}

const PI = Math.PI;
const TWO_PI = Math.PI * 2;

export const getShapePerimeter = (shape: Shape, R: number, elongation: number = 2): number => {
  switch (shape) {
    case Shape.CIRCLE:
      return TWO_PI * R;
    case Shape.SQUARE:
      // Rounded square: Width = 2R. 
      // For consistency with Stadium, let's allow elongation to stretch it into a rectangle?
      // But prompt specifically asked for Stadium independent scales.
      // Let's keep Square as Square for now, or strictly R.
      // R is half-width. 
      const crS = R * 0.5;
      const straightS = (2 * R) - (2 * crS);
      return (4 * straightS) + (TWO_PI * crS);
    case Shape.TRIANGLE:
      // Rounded Equilateral Triangle
      // R is distance from centroid to sharp vertex.
      // cr is corner radius.
      const crT = R * 0.25;
      // Side length of sharp triangle
      const sharpSide = R * Math.sqrt(3);
      // Distance from sharp vertex to tangent point
      const x = crT * Math.sqrt(3);
      // Straight segment length
      const straightLen = sharpSide - 2 * x;
      // Corner arc length (120 degrees)
      const cornerLen = (TWO_PI / 3) * crT;
      return 3 * (straightLen + cornerLen);
    case Shape.STADIUM:
      // Semicircles radius R.
      // Straight length = R * elongation.
      const straightLenStadium = R * elongation;
      return (TWO_PI * R) + (2 * straightLenStadium);
    default:
      return TWO_PI * R;
  }
};

export const getShapeData = (shape: Shape, R: number, elongation: number, distance: number): ShapePoint => {
  const perimeter = getShapePerimeter(shape, R, elongation);
  // Normalize distance to [0, perimeter)
  let s = distance % perimeter;
  if (s < 0) s += perimeter;

  switch (shape) {
    case Shape.CIRCLE: {
      const theta = s / R;
      return {
        x: R * Math.cos(theta),
        y: R * Math.sin(theta),
        normalAngle: theta
      };
    }
    case Shape.SQUARE: {
      // Rounded Square Logic (Centered at 0,0)
      const cr = R * 0.5;
      const w = 2 * R;
      const straightLen = w - 2 * cr;
      const cornerLen = 0.5 * PI * cr;
      
      // Define one side segment (Straight/2 -> Corner -> Straight/2) ?
      // No, simpler to trace perimeter CCW.
      // Start at Bottom Center (0, -R). Move Right.
      // Bottom Half Right -> Bottom Right Corner -> Right Side -> ...
      
      // Simplified loop: 4 Sides.
      // Side 0: Bottom. Normal -90 (3PI/2).
      // Side 1: Right. Normal 0.
      // Side 2: Top. Normal 90 (PI/2).
      // Side 3: Left. Normal 180 (PI).
      
      // Let's use a standard segment approach rotated 90 degrees.
      // Segment: Straight (Length S) + Corner (Length C).
      // Start at beginning of straight part on Bottom Edge?
      // Let's stick to the implementation that works, fixing the start point logic.
      
      // Start at Right Edge Center (R, 0). Go Up.
      // Sequence: Right-Up-Half, TR Corner, Top Edge, TL Corner, Left Edge, BL Corner, Bottom Edge, BR Corner, Right-Down-Half.
      // Too complex.
      
      // Let's stick to: Start Bottom-Right of straight section on Right Side?
      // Let's start at (R, -straightLen/2).
      
      const sideTotal = straightLen + cornerLen;
      
      // Determine which of the 4 segments we are in
      const sideIdx = Math.floor(s / sideTotal);
      let localS = s % sideTotal;
      
      // Base rotation for side 0 (Right), 1 (Top), 2 (Left), 3 (Bottom)
      // Side 0 (Right) starts at bottom of right straight edge?
      // Let's define Side 0 as "Right Face". Normal 0.
      // Path: Straight Line going UP. Then Corner turning Left.
      // Start point relative to center: (R, -straightLen/2).
      
      const rots = [0, PI/2, PI, 1.5*PI];
      const rot = rots[sideIdx % 4];
      
      if (localS < straightLen) {
        // Straight section
        // Unrotated: (R, -straightLen/2 + localS)
        const ux = R;
        const uy = -straightLen/2 + localS;
        
        // Rotate (ux, uy) by rot
        const rx = ux * Math.cos(rot) - uy * Math.sin(rot);
        const ry = ux * Math.sin(rot) + uy * Math.cos(rot);
        return { x: rx, y: ry, normalAngle: rot };
      } 
      
      localS -= straightLen;
      
      // Corner section (turning +90 deg)
      // Center of corner relative to shape center: (R-cr, R-cr) ??
      // Relative to unrotated Side 0: Center is at (R - cr, straightLen/2).
      // Arc from angle 0 to PI/2.
      
      const cx = R - cr;
      const cy = straightLen/2;
      const theta = (localS / cornerLen) * (PI/2); // 0 to 90
      
      const ux = cx + cr * Math.cos(theta);
      const uy = cy + cr * Math.sin(theta);
       
      // Rotate
      const rx = ux * Math.cos(rot) - uy * Math.sin(rot);
      const ry = ux * Math.sin(rot) + uy * Math.cos(rot);
      
      // Normal also rotates. Base normal at start of arc is 0. End is 90.
      // So normal is theta. + rotation.
      return { x: rx, y: ry, normalAngle: theta + rot };
    }

    case Shape.TRIANGLE: {
      // Rounded Equilateral Triangle (Point UP)
      // R is circumradius of sharp triangle.
      // Centroid (0,0).
      const cr = R * 0.25;
      const sharpSide = R * Math.sqrt(3);
      const xOffset = cr * Math.sqrt(3);
      const straightLen = sharpSide - 2 * xOffset;
      const cornerLen = (TWO_PI / 3) * cr;
      const segmentLen = straightLen + cornerLen;
      
      // 3 Segments.
      // Segment 0: Bottom Edge (Right half + Left half?? No).
      // Standardize: Start at Center of Bottom Edge. Go Right (CCW).
      // Bottom Edge Normal is 270 (-90).
      // Tangent direction is 0 (Right).
      
      const segIdx = Math.floor(s / segmentLen);
      let localS = s % segmentLen;
      
      // Rotations: 0 (Bottom), 1 (Right), 2 (Left).
      // Wait, the shape angles are 0, 120, 240.
      // But "Bottom" is actually rotated -90 relative to Right?
      // Let's define the "Base Segment" as the Bottom Edge.
      // Vertices at 90 (Top), 210 (BL), 330 (BR).
      // Bottom Edge is between 210 and 330.
      // Center of Bottom Edge is (0, -R/2). (Apothem = R/2).
      
      // Rotation for segments:
      // Seg 0: Bottom. Normal -PI/2.
      // Seg 1: Right (Top-Right). Normal -PI/2 + 2PI/3 = PI/6 (30 deg).
      // Seg 2: Left (Top-Left). Normal PI/6 + 2PI/3 = 5PI/6 (150 deg).
      
      const baseNormal = -PI/2;
      const segRot = segIdx * (TWO_PI/3);
      const currentNormalBase = baseNormal + segRot; // The normal of the straight part
      
      const apothem = R * 0.5; 
      // Note: For rounded triangle, the flat edge is pulled IN by cr? 
      // No, usually we round off the tips. The flat sides stay where they are.
      // Distance from center to straight line = apothem.
      
      if (localS < straightLen) {
        // Straight part.
        // Start at beginning of straight edge.
        // The full straight edge length is straightLen.
        // We start at the "beginning" of the edge in CCW order?
        // No, logic is easier if we define a segment as:
        // Start at Middle of Edge -> End of Edge -> Corner -> Middle of Next Edge?
        // No, let's stick to Vertex to Vertex logic.
        // Start at Bottom-Left "end of curve" point?
        
        // Let's align with: s=0 is Center of Bottom Edge.
        // Then perimeter logic needs to handle "Half Straight - Corner - Half Straight"?
        // Or just wrap the start point.
        
        // Let's assume s=0 is the START of the Bottom Straight Edge (which is near Bottom Left).
        // Bottom Edge goes from BL to BR.
        // Center of Bottom Edge is (0, -apothem).
        // Length is straightLen.
        // So Start Point (unrotated relative to bottom) is (-straightLen/2, -apothem).
        
        const ux = -straightLen/2 + localS;
        const uy = -apothem;
        
        // Rotate (ux, uy) by segRot relative to (0,0) ?
        // Wait, the "Bottom" segment is already rotated if we use standard coordinates.
        // Let's define the "Standard Segment" as the one on the bottom (y = -apothem).
        // Then rotate that geometry by 0, 120, 240.
        
        const rx = ux * Math.cos(segRot) - uy * Math.sin(segRot);
        const ry = ux * Math.sin(segRot) + uy * Math.cos(segRot);
        
        return { x: rx, y: ry, normalAngle: currentNormalBase };
      }
      
      localS -= straightLen;
      
      // Corner part.
      // Connects Bottom Straight (Normal -90) to Right Straight (Normal 30).
      // Change in angle = 120 degrees.
      // Center of corner arc?
      // End of Bottom Straight: (straightLen/2, -apothem).
      // Normal is (0, -1).
      // Arc Center is (straightLen/2, -apothem + cr).
      
      const cx = straightLen/2;
      const cy = -apothem + cr;
      
      // Angle sweeps from -PI/2 to -PI/2 + 2PI/3 = PI/6.
      const theta = -PI/2 + (localS / cornerLen) * (TWO_PI/3);
      
      const ux = cx + cr * Math.cos(theta);
      const uy = cy + cr * Math.sin(theta);
      
      const rx = ux * Math.cos(segRot) - uy * Math.sin(segRot);
      const ry = ux * Math.sin(segRot) + uy * Math.cos(segRot);
      
      return { x: rx, y: ry, normalAngle: theta + segRot };
    }

    case Shape.STADIUM: {
      // R is radius of semicircles.
      // Elongation determines length of straight section.
      const straightLen = R * elongation;
      const arcLen = PI * R;
      
      // 4 Segments: Top Straight, Right Arc, Bottom Straight, Left Arc.
      
      // Seg 1: Top Straight (0 to straightLen). Moves Right.
      // Center of Stadium is (0,0).
      // Top straight is at y = R. x goes from -straightLen/2 to straightLen/2.
      
      if (s < straightLen) {
        return { x: -straightLen/2 + s, y: R, normalAngle: PI/2 };
      }
      s -= straightLen;
      
      // Seg 2: Right Arc. Center (straightLen/2, 0).
      if (s < arcLen) {
        const theta = PI/2 - (s / R); // Goes from PI/2 to -PI/2
        return {
          x: straightLen/2 + R * Math.cos(theta),
          y: 0 + R * Math.sin(theta),
          normalAngle: theta
        };
      }
      s -= arcLen;
      
      // Seg 3: Bottom Straight. y = -R. x goes from straightLen/2 to -straightLen/2.
      if (s < straightLen) {
        return { x: straightLen/2 - s, y: -R, normalAngle: -PI/2 };
      }
      s -= straightLen;
      
      // Seg 4: Left Arc. Center (-straightLen/2, 0).
      // Angle -PI/2 to -3PI/2 (or PI/2).
      if (s < arcLen) {
        const theta = -PI/2 - (s / R);
        return {
          x: -straightLen/2 + R * Math.cos(theta),
          y: 0 + R * Math.sin(theta),
          normalAngle: theta
        };
      }
      
      // Fallback
      return { x: -straightLen/2, y: R, normalAngle: PI/2 };
    }
  }
  
  return { x: 0, y: 0, normalAngle: 0 };
};

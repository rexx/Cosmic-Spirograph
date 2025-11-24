import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SpirographParams, Mode } from '../types';
import { getShapeData, getShapePerimeter } from '../utils/geometry';

interface CanvasProps {
  params: SpirographParams;
  isPlaying: boolean;
  clearTrigger: number;
  isDarkMode: boolean;
  showGuides: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ params, isPlaying, clearTrigger, isDarkMode, showGuides }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const distanceRef = useRef<number>(0); // Track distance traveled instead of angle
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { clientWidth, clientHeight } = canvasRef.current.parentElement;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle canvas resizing
  useEffect(() => {
    if (canvasRef.current && backgroundCanvasRef.current) {
      canvasRef.current.width = dimensions.width;
      canvasRef.current.height = dimensions.height;
      backgroundCanvasRef.current.width = dimensions.width;
      backgroundCanvasRef.current.height = dimensions.height;
      
      if (!isPlaying) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
           drawOverlay(ctx, dimensions.width, dimensions.height, distanceRef.current);
        }
      }
    }
  }, [dimensions]);

  // Helper function to draw the fixed gear shape
  const drawFixedGearShape = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    const { R, shape, elongation } = params;
    const perimeter = getShapePerimeter(shape, R, elongation);
    const step = Math.max(1, perimeter / 200); // Resolution
    
    ctx.beginPath();
    const start = getShapeData(shape, R, elongation, 0);
    ctx.moveTo(cx + start.x, cy + start.y);
    
    for (let s = step; s <= perimeter; s += step) {
      const p = getShapeData(shape, R, elongation, s);
      ctx.lineTo(cx + p.x, cy + p.y);
    }
    ctx.closePath();
    ctx.stroke();
  }, [params]);

  // Helper function to draw the UI overlay (gears, arms)
  const drawOverlay = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, distance: number) => {
    if (!showGuides) return;

    const { R, r, d, mode, color, shape, strokeWidth, elongation } = params;
    const cx = width / 2;
    const cy = height / 2;

    const fixedGearColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
    const movingGearColor = isDarkMode ? 'rgba(100, 200, 255, 0.4)' : 'rgba(0, 100, 200, 0.3)';
    const armColor = isDarkMode ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';

    // Draw Fixed Gear
    ctx.strokeStyle = fixedGearColor;
    ctx.lineWidth = 2;
    drawFixedGearShape(ctx, cx, cy);

    // Calculate Moving Gear Position
    const shapePoint = getShapeData(shape, R, elongation, distance);
    const { x: px, y: py, normalAngle } = shapePoint;
    
    let gearCx, gearCy;
    // Normal points OUT from fixed shape
    if (mode === Mode.INNER) {
      gearCx = cx + px - r * Math.cos(normalAngle);
      gearCy = cy + py - r * Math.sin(normalAngle);
    } else {
      gearCx = cx + px + r * Math.cos(normalAngle);
      gearCy = cy + py + r * Math.sin(normalAngle);
    }

    // Draw Moving Gear
    ctx.strokeStyle = movingGearColor;
    ctx.beginPath();
    ctx.arc(gearCx, gearCy, r, 0, 2 * Math.PI);
    ctx.stroke();

    // Calculate Pen Position
    let contactAngle = normalAngle;
    if (mode === Mode.OUTER) {
      contactAngle += Math.PI;
    }
    
    const penTheta = contactAngle - (distance / r);
    
    const penX = gearCx + d * Math.cos(penTheta);
    const penY = gearCy + d * Math.sin(penTheta);

    ctx.strokeStyle = armColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gearCx, gearCy);
    ctx.lineTo(penX, penY);
    ctx.stroke();

    // Draw Pen Point
    ctx.fillStyle = color;
    ctx.beginPath();
    const penRadius = Math.max(4, strokeWidth / 2 + 1);
    ctx.arc(penX, penY, penRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = isDarkMode ? '#000' : '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [params, isDarkMode, drawFixedGearShape, showGuides]);

  // Explicit Clear Logic
  useEffect(() => {
    if (backgroundCanvasRef.current && canvasRef.current) {
      const bgCtx = backgroundCanvasRef.current.getContext('2d');
      const ctx = canvasRef.current.getContext('2d');
      if (bgCtx && ctx) {
        bgCtx.clearRect(0, 0, dimensions.width, dimensions.height);
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        distanceRef.current = 0;
        drawOverlay(ctx, dimensions.width, dimensions.height, 0);
      }
    }
  }, [clearTrigger]); 

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    const bgCtx = bgCanvas.getContext('2d');
    if (!ctx || !bgCtx) return;

    const animate = () => {
      if (!isPlaying) return;

      const { R, r, d, mode, speed, color, shape, strokeWidth, elongation } = params;
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;

      // Steps based on speed.
      const stepSize = 2; 
      const steps = Math.ceil(speed); 
      
      bgCtx.strokeStyle = color;
      bgCtx.lineWidth = strokeWidth || 1.5;
      bgCtx.lineCap = 'round';
      bgCtx.beginPath();

      // Calculate start position of this frame
      let startDist = distanceRef.current;
      
      // Move to current tip position
      const startShapeP = getShapeData(shape, R, elongation, startDist);
      let startNorm = startShapeP.normalAngle;
      let startGearCx, startGearCy;
      if (mode === Mode.INNER) {
         startGearCx = cx + startShapeP.x - r * Math.cos(startNorm);
         startGearCy = cy + startShapeP.y - r * Math.sin(startNorm);
      } else {
         startGearCx = cx + startShapeP.x + r * Math.cos(startNorm);
         startGearCy = cy + startShapeP.y + r * Math.sin(startNorm);
      }
      let startContactA = startNorm + (mode === Mode.OUTER ? Math.PI : 0);
      let startPenTheta = startContactA - (startDist / r);
      let startPenX = startGearCx + d * Math.cos(startPenTheta);
      let startPenY = startGearCy + d * Math.sin(startPenTheta);

      bgCtx.moveTo(startPenX, startPenY);

      for (let i = 0; i < steps; i++) {
        distanceRef.current += stepSize;
        const dist = distanceRef.current;

        const sp = getShapeData(shape, R, elongation, dist);
        const norm = sp.normalAngle;
        
        let gCx, gCy;
        if (mode === Mode.INNER) {
          gCx = cx + sp.x - r * Math.cos(norm);
          gCy = cy + sp.y - r * Math.sin(norm);
        } else {
          gCx = cx + sp.x + r * Math.cos(norm);
          gCy = cy + sp.y + r * Math.sin(norm);
        }

        let cAngle = norm + (mode === Mode.OUTER ? Math.PI : 0);
        let pTheta = cAngle - (dist / r);
        let pX = gCx + d * Math.cos(pTheta);
        let pY = gCy + d * Math.sin(pTheta);

        bgCtx.lineTo(pX, pY);
      }
      bgCtx.stroke();

      // Clear Foreground and Draw Overlay
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.drawImage(bgCanvas, 0, 0);
      
      drawOverlay(ctx, dimensions.width, dimensions.height, distanceRef.current);

      requestRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } 

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, params, dimensions, isDarkMode, drawOverlay, showGuides]);

  // Static Redraw Effect
  useEffect(() => {
    if (isPlaying) return;

    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.drawImage(bgCanvas, 0, 0);
    drawOverlay(ctx, dimensions.width, dimensions.height, distanceRef.current);

  }, [isPlaying, params, isDarkMode, dimensions, drawOverlay, showGuides]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={backgroundCanvasRef} className="hidden" />
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default Canvas;
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SpirographParams, Mode } from '../types';
import { getShapeData, getShapePerimeter } from '../utils/geometry';
import { Plus, Minus, Maximize } from 'lucide-react';

interface CanvasProps {
  params: SpirographParams;
  isPlaying: boolean;
  clearTrigger: number;
  isDarkMode: boolean;
  showGuides: boolean;
  showCanvasControls: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ params, isPlaying, clearTrigger, isDarkMode, showGuides, showCanvasControls }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const distanceRef = useRef<number>(0); // Track distance traveled instead of angle
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Viewport State (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  
  // Track previous clear trigger to prevent auto-clearing on re-renders
  const prevClearTrigger = useRef(clearTrigger);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { clientWidth, clientHeight } = canvasRef.current.parentElement;
        // Ensure strictly positive dimensions to prevent InvalidStateError
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({ width: clientWidth, height: clientHeight });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (width <= 0 || height <= 0) return;

    const { R, r, d, mode, color, shape, strokeWidth, elongation, isReverseGear } = params;
    const cx = width / 2;
    const cy = height / 2;

    const fixedGearColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
    const movingGearColor = isDarkMode ? 'rgba(100, 200, 255, 0.4)' : 'rgba(0, 100, 200, 0.3)';
    const armColor = isDarkMode ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';

    // Adjust line widths based on zoom so they stay visually constant
    const scaledLineWidth = 2 / zoom;
    const scaledThinLine = 1 / zoom;
    const scaledMediumLine = 1.5 / zoom;

    // Draw Fixed Gear
    ctx.strokeStyle = fixedGearColor;
    ctx.lineWidth = scaledLineWidth;
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
    ctx.lineWidth = scaledThinLine;
    ctx.beginPath();
    ctx.arc(gearCx, gearCy, r, 0, 2 * Math.PI);
    ctx.stroke();

    // Calculate Pen Position
    let contactAngle = normalAngle;
    if (mode === Mode.OUTER) {
      contactAngle += Math.PI;
    }
    
    // Rotation Calculation:
    // Standard Physics:
    // Inner (Hypo): Orbit CW -> Rotation CCW relative to contact line -> Subtract Angle
    // Outer (Epi): Orbit CW -> Rotation CW relative to contact line -> Add Angle
    
    // Reverse Gear (Anti-Physics):
    // Inner: Add Angle
    // Outer: Subtract Angle
    
    const rotation = distance / r;
    const sign = (mode === Mode.OUTER ? 1 : -1) * (isReverseGear ? -1 : 1);
    const penTheta = contactAngle + (sign * rotation);
    
    const penX = gearCx + d * Math.cos(penTheta);
    const penY = gearCy + d * Math.sin(penTheta);

    ctx.strokeStyle = armColor;
    ctx.lineWidth = scaledMediumLine;
    ctx.beginPath();
    ctx.moveTo(gearCx, gearCy);
    ctx.lineTo(penX, penY);
    ctx.stroke();

    // Draw Pen Point
    ctx.fillStyle = color;
    ctx.beginPath();
    // Keep point size visible but responsive to zoom
    const baseRadius = Math.max(4, strokeWidth / 2 + 1);
    const visualRadius = Math.max(2, baseRadius / Math.sqrt(zoom));
    
    ctx.arc(penX, penY, visualRadius, 0, 2 * Math.PI);
    ctx.fill();
    // Use White stroke for Dark Mode, Black stroke for Light Mode
    ctx.strokeStyle = isDarkMode ? '#fff' : '#000';
    ctx.lineWidth = scaledThinLine;
    ctx.stroke();
  }, [params, isDarkMode, drawFixedGearShape, showGuides, zoom]);

  // Main Render Logic
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    // 1. Clear Screen & Reset Transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // 2. Apply View Transformation (Pan & Zoom)
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    
    ctx.translate(cx + pan.x, cy + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    // 3. Draw Background Layer (The drawings)
    if (bgCanvas.width > 0 && bgCanvas.height > 0) {
      ctx.drawImage(bgCanvas, 0, 0);
    }

    // 4. Draw Overlay (UI guides)
    drawOverlay(ctx, dimensions.width, dimensions.height, distanceRef.current);

    // Reset transform for safety
    ctx.setTransform(1, 0, 0, 1, 0, 0);

  }, [dimensions, pan, zoom, drawOverlay]);

  // Handle canvas resizing
  useEffect(() => {
    if (canvasRef.current && backgroundCanvasRef.current) {
      const bgCanvas = backgroundCanvasRef.current;
      const ctx = bgCanvas.getContext('2d');
      
      // Save existing content before resizing
      let tempCanvas: HTMLCanvasElement | null = null;
      if (ctx && bgCanvas.width > 0 && bgCanvas.height > 0) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = bgCanvas.width;
        tempCanvas.height = bgCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(bgCanvas, 0, 0);
        }
      }

      const w = Math.max(1, dimensions.width);
      const h = Math.max(1, dimensions.height);

      canvasRef.current.width = w;
      canvasRef.current.height = h;
      backgroundCanvasRef.current.width = w;
      backgroundCanvasRef.current.height = h;
      
      // Restore content, maintaining the center
      if (ctx && tempCanvas) {
        // Calculate offsets to keep the drawing centered
        const oldCx = tempCanvas.width / 2;
        const oldCy = tempCanvas.height / 2;
        const newCx = w / 2;
        const newCy = h / 2;
        
        const dx = newCx - oldCx;
        const dy = newCy - oldCy;
        
        ctx.drawImage(tempCanvas, dx, dy);
      }
      
      // Force a redraw when dimensions change
      requestAnimationFrame(renderFrame);
    }
  }, [dimensions, renderFrame]);

  // Explicit Clear Logic
  useEffect(() => {
    // Only run if clearTrigger actually changed (prevents clearing on zoom/pan/param change)
    if (clearTrigger !== prevClearTrigger.current) {
      prevClearTrigger.current = clearTrigger;

      if (backgroundCanvasRef.current && canvasRef.current) {
        const bgCtx = backgroundCanvasRef.current.getContext('2d');
        if (bgCtx && dimensions.width > 0 && dimensions.height > 0) {
          bgCtx.clearRect(0, 0, dimensions.width, dimensions.height);
          distanceRef.current = 0;
          renderFrame();
        }
      }
    }
  }, [clearTrigger, renderFrame, dimensions]); 

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    const animate = () => {
      // If playing, update the drawing on background canvas
      if (isPlaying) {
        if (dimensions.width <= 0 || dimensions.height <= 0) return;

        const { R, r, d, mode, speed, color, shape, strokeWidth, elongation, isReverseGear } = params;
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;

        const stepSize = 2; 
        const steps = Math.ceil(speed); 
        
        bgCtx.strokeStyle = color;
        bgCtx.lineWidth = strokeWidth || 1.5;
        bgCtx.lineCap = 'round';
        bgCtx.beginPath();

        let startDist = distanceRef.current;
        
        // Calculate start position of this frame
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
        
        let startRot = startDist / r;
        let startSign = (mode === Mode.OUTER ? 1 : -1) * (isReverseGear ? -1 : 1);
        let startPenTheta = startContactA + (startSign * startRot);

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
          
          let rot = dist / r;
          let sign = (mode === Mode.OUTER ? 1 : -1) * (isReverseGear ? -1 : 1);
          let pTheta = cAngle + (sign * rot);

          let pX = gCx + d * Math.cos(pTheta);
          let pY = gCy + d * Math.sin(pTheta);

          bgCtx.lineTo(pX, pY);
        }
        bgCtx.stroke();
      }

      // Always render the visual frame (handling pan/zoom updates)
      renderFrame();

      if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // If paused, ensure we render at least once (e.g. for pan/zoom updates)
      renderFrame();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, params, dimensions, isDarkMode, renderFrame, zoom, pan]);

  // Interaction Handlers

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const scaleFactor = 0.1;
    // Scroll up (negative delta) -> Zoom In
    const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;
    setZoom(z => Math.max(0.1, Math.min(5, z + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      // Note: touch-action: none in CSS prevents scrolling
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(5, z + 0.2));
  const handleZoomOut = () => setZoom(z => Math.max(0.1, z - 0.2));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100 dark:bg-gray-900/50">
      <canvas ref={backgroundCanvasRef} className="hidden" />
      <canvas 
        ref={canvasRef} 
        className={`block w-full h-full touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />

      {/* Zoom Controls */}
      {showCanvasControls && (
        <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-lg shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 transition-colors"
            title="Zoom In"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 transition-colors"
            title="Zoom Out"
          >
            <Minus size={20} />
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-0.5" />
          <button 
            onClick={handleResetView}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 transition-colors"
            title="Reset View"
          >
            <Maximize size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;
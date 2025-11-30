import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import ControlPanel from './components/ControlPanel';
import { SpirographParams, Mode, Language, Shape, PatternPreset, SavedSpirographParams } from './types';
import { generateCreativePattern } from './utils/randomizer';
import { parseParamsFromQueryString, serializeParamsToQueryString } from './utils/urlHelper';
import { getStoredPresets, saveStoredPreset, deleteStoredPreset } from './utils/storage';
import { PenLine } from 'lucide-react';

const App: React.FC = () => {
  // Initialize params from URL if present, otherwise use defaults
  const [params, setParams] = useState<SpirographParams>(() => {
    const defaults: SpirographParams = {
      R: 120,
      r: 35,
      d: 60,
      color: '#00ffff',
      speed: 5,
      mode: Mode.INNER,
      shape: Shape.CIRCLE,
      resolution: 0.1,
      strokeWidth: 2,
      elongation: 2.0,
      isReverseGear: false
    };
    
    // Check if we are in a browser environment
    if (typeof window !== 'undefined') {
      const parsed = parseParamsFromQueryString(window.location.search);
      // parsed params do not include speed, so default speed is preserved
      return { ...defaults, ...parsed };
    }
    
    return defaults;
  });

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isPushPlaying, setIsPushPlaying] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [showGuides, setShowGuides] = useState(true);
  
  // UI State: Canvas Floating Controls Visibility
  const [showCanvasControls, setShowCanvasControls] = useState(true);
  
  // Presets State
  const [presets, setPresets] = useState<PatternPreset[]>([]);

  // Load presets on mount
  useEffect(() => {
    setPresets(getStoredPresets());
  }, []);

  // Initialize dark mode from system preference or default to true
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Apply dark mode class to HTML element
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleClear = () => {
    setClearTrigger(prev => prev + 1);
    setIsAutoPlaying(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Do not stop auto playing here, allowing for continuous drawing during parameter changes.

    const result = await generateCreativePattern();
    if (result) {
      setParams(prev => ({
        ...prev,
        R: result.R,
        r: result.r,
        d: result.d,
        color: result.color,
        mode: result.mode === 'INNER' ? Mode.INNER : Mode.OUTER,
        shape: result.shape === 'SQUARE' ? Shape.SQUARE : 
               result.shape === 'TRIANGLE' ? Shape.TRIANGLE : 
               result.shape === 'STADIUM' ? Shape.STADIUM : 
               Shape.CIRCLE,
        elongation: result.elongation ?? 2.0,
        // Reset reverse gear on random gen? Or keep? Let's keep existing setting or default false.
        // Usually randomizer is for standard patterns, so let's default to false.
        isReverseGear: false
      }));
    }
    setIsGenerating(false);
  };

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    
    const qs = serializeParamsToQueryString(params);
    const url = `${window.location.origin}${window.location.pathname}?${qs}`;
    
    // Simply copy to clipboard. Do not pushState to history to avoid SecurityError.
    navigator.clipboard.writeText(url).catch(err => {
      console.error('Failed to copy URL:', err);
    });
  };

  // Preset Handlers
  const handleSavePreset = (name: string) => {
    const updated = saveStoredPreset(name, params);
    setPresets(updated);
  };

  const handleDeletePreset = (id: string) => {
    const updated = deleteStoredPreset(id);
    setPresets(updated);
  };

  const handleLoadPreset = (presetParams: SavedSpirographParams) => {
    // Merge presetParams (no speed) with current state to preserve current speed
    setParams(prev => ({ ...prev, ...presetParams }));
  };

  // Combined playing state
  const isPlaying = isAutoPlaying || isPushPlaying;

  const handlePushStart = () => {
    if (!isAutoPlaying) {
      setIsPushPlaying(true);
    }
  };

  const handlePushEnd = () => {
    setIsPushPlaying(false);
  };

  const toggleAutoPlay = (val: boolean) => {
    setIsAutoPlaying(val);
    // If turning off auto play, ensure push play is also off to be safe
    if (!val) setIsPushPlaying(false);
  };

  const translations = {
    en: { pushToDraw: "Push to Draw" },
    zh: { pushToDraw: "按住畫圖" }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-300 relative">
      
      {/* Controls: Top on Mobile, Right on Desktop */}
      <div className="order-1 md:order-2 w-full h-[40%] md:w-80 md:h-full flex-none z-20 shadow-md md:shadow-none relative">
        <ControlPanel
          params={params}
          setParams={setParams}
          isPlaying={isAutoPlaying}
          setIsPlaying={toggleAutoPlay}
          onClear={handleClear}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={setLanguage}
          showGuides={showGuides}
          setShowGuides={setShowGuides}
          onShare={handleShare}
          presets={presets}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          onLoadPreset={handleLoadPreset}
          showCanvasControls={showCanvasControls}
          toggleCanvasControls={() => setShowCanvasControls(!showCanvasControls)}
        />
      </div>

      {/* Canvas: Bottom on Mobile, Left on Desktop */}
      <main className="order-2 md:order-1 flex-1 h-[60%] md:h-full relative overflow-hidden group">
        <Canvas 
          params={params} 
          isPlaying={isPlaying} 
          clearTrigger={clearTrigger}
          isDarkMode={isDarkMode}
          showGuides={showGuides}
          showCanvasControls={showCanvasControls}
        />

        {/* Floating Push to Draw Button */}
        {showCanvasControls && (
          <button
            onMouseDown={handlePushStart}
            onMouseUp={handlePushEnd}
            onMouseLeave={handlePushEnd}
            onTouchStart={(e) => { e.preventDefault(); handlePushStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); handlePushEnd(); }}
            className={`
              absolute bottom-6 right-6 z-30
              flex items-center gap-2 px-6 py-4 rounded-full
              bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg
              shadow-xl shadow-indigo-500/40
              transition-all duration-75 ease-in-out select-none
              ${isPushPlaying 
                ? 'scale-95 translate-y-1 shadow-none bg-indigo-500' 
                : 'active:scale-95 active:translate-y-1 active:shadow-none'
              }
            `}
          >
            <PenLine size={28} />
            <span className="hidden sm:inline">{translations[language].pushToDraw}</span>
          </button>
        )}
      </main>
    </div>
  );
};

export default App;
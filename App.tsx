import React, { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import ControlPanel from './components/ControlPanel';
import { SpirographParams, Mode, Language, Shape } from './types';
import { generateCreativePattern } from './utils/randomizer';

const App: React.FC = () => {
  const [params, setParams] = useState<SpirographParams>({
    R: 120,
    r: 35,
    d: 60,
    color: '#00ffff',
    speed: 5,
    mode: Mode.INNER,
    shape: Shape.CIRCLE,
    resolution: 0.1,
    strokeWidth: 2,
    elongation: 2.0
  });

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isPushPlaying, setIsPushPlaying] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [showGuides, setShowGuides] = useState(true);
  
  // Initialize dark mode from system preference or default to true
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Apply dark mode class to HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
        elongation: result.elongation ?? 2.0
      }));
    }
    setIsGenerating(false);
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

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-300">
      
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
          onPushStart={handlePushStart}
          onPushEnd={handlePushEnd}
        />
      </div>

      {/* Canvas: Bottom on Mobile, Left on Desktop */}
      <main className="order-2 md:order-1 flex-1 h-[60%] md:h-full relative">
        <Canvas 
          params={params} 
          isPlaying={isPlaying} 
          clearTrigger={clearTrigger}
          isDarkMode={isDarkMode}
          showGuides={showGuides}
        />
      </main>
    </div>
  );
};

export default App;
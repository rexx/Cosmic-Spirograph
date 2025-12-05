import React, { useState, useRef } from 'react';
import { Mode, SpirographParams, Language, Shape, PatternPreset, SavedSpirographParams } from '../types';
import { Play, Trash2, Wand2, Sun, Moon, Languages, Circle, Square, Triangle, Minus, Eye, EyeOff, Share2, Check, Save, FolderOpen, X, Image as ImageIcon, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  params: SpirographParams;
  setParams: React.Dispatch<React.SetStateAction<SpirographParams>>;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  onClear: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  showGuides: boolean;
  setShowGuides: (val: boolean) => void;
  onShare: () => void;
  // Preset props
  presets: PatternPreset[];
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onLoadPreset: (params: SavedSpirographParams) => void;
  // Canvas UI controls
  showCanvasControls: boolean;
  toggleCanvasControls: () => void;
}

const translations = {
  en: {
    title: "Cosmic Spirograph",
    autoDraw: "Auto Draw",
    autoStop: "Stop Auto",
    clear: "Clear Canvas",
    guides: "Toggle Guides",
    canvasUi: "Toggle Canvas UI",
    share: "Share / Save URL",
    shareBtn: "Share Current Config",
    copied: "Copied!",
    shape: "Fixed Gear Shape",
    sCircle: "Circle",
    sSquare: "Square",
    sTriangle: "Triangle",
    sStadium: "Stadium",
    gearType: "Gear Type",
    inner: "Inner (Hypo)",
    outer: "Outer (Epi)",
    fixedRadius: "Fixed Scale (R)",
    movingRadius: "Moving Radius (r)",
    penOffset: "Pen Offset (d)",
    elongation: "Length Scale",
    thickness: "Line Thickness",
    speed: "Drawing Speed",
    penColor: "Pen Color",
    reverseGear: "Reverse Gear Rotation",
    aiTitle: "Randomizer",
    aiDesc: "Generate a random geometric configuration.",
    surprise: "Surprise Me",
    library: "Library",
    savePlaceholder: "Pattern Name...",
    save: "Save",
    load: "Load",
    rainbow: "Rainbow",
  },
  zh: {
    title: "宇宙萬花尺",
    autoDraw: "自動繪製",
    autoStop: "停止自動",
    clear: "清除畫布",
    guides: "顯示/隱藏尺規",
    canvasUi: "顯示/隱藏浮動按鈕",
    share: "分享 / 儲存網址",
    shareBtn: "分享目前設定",
    copied: "已複製連結！",
    shape: "固定齒輪形狀",
    sCircle: "圓形",
    sSquare: "正方形",
    sTriangle: "三角形",
    sStadium: "長條形",
    gearType: "齒輪類型",
    inner: "內圈 (內旋輪線)",
    outer: "外圈 (外旋輪線)",
    fixedRadius: "固定齒輪大小 (R)",
    movingRadius: "移動齒輪半徑 (r)",
    penOffset: "筆尖孔洞距離 (d)",
    elongation: "長度比例",
    thickness: "線條粗細",
    speed: "繪製速度",
    penColor: "筆尖顏色",
    reverseGear: "反向齒輪自轉 (反物理)",
    aiTitle: "隨機產生器",
    aiDesc: "隨機產生一組幾何參數配置。",
    surprise: "幫我設計 (Surprise Me)",
    library: "圖案庫",
    savePlaceholder: "輸入名稱...",
    save: "儲存",
    load: "載入",
    rainbow: "彩虹模式",
  }
};

// Helper to convert HSL to Hex for the spectrum picker
const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// The specific full spectrum gradient requested
const RAINBOW_GRADIENT_STOPS = 'rgb(255, 0, 0), rgb(255, 255, 0), rgb(0, 255, 0), rgb(0, 255, 255), rgb(0, 0, 255), rgb(255, 0, 255), rgb(255, 0, 0)';

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  setParams,
  isPlaying,
  setIsPlaying,
  onClear,
  onGenerate,
  isGenerating,
  isDarkMode,
  toggleTheme,
  language,
  setLanguage,
  showGuides,
  setShowGuides,
  onShare,
  presets,
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
  showCanvasControls,
  toggleCanvasControls
}) => {
  const t = translations[language];
  const [showCopied, setShowCopied] = useState(false);
  const [presetName, setPresetName] = useState('');
  const spectrumRef = useRef<HTMLDivElement>(null);
  const [isDraggingSpectrum, setIsDraggingSpectrum] = useState(false);

  const handleChange = (key: keyof SpirographParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleShareClick = () => {
    onShare();
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleSaveClick = () => {
    if (presetName.trim()) {
      onSavePreset(presetName);
      setPresetName('');
    }
  };

  // Spectrum Interaction Logic
  const handleSpectrumChange = (e: React.MouseEvent | React.TouchEvent) => {
    if (!spectrumRef.current) return;
    
    const rect = spectrumRef.current.getBoundingClientRect();
    let clientX;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    // Calculate Hue based on X position (0 to 360)
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width)); // Clamp
    const hue = (x / rect.width) * 360;
    
    // Convert to Hex with 100% Saturation and 50% Lightness
    const hex = hslToHex(hue, 100, 50);
    handleChange('color', hex);
  };

  // Primary colors + BW (Ordered as requested: Red, Yellow, Green, Cyan, Blue, Magenta)
  const colorPresets = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffffff', '#000000'];

  const isRainbow = params.color === 'rainbow';

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 p-6 flex flex-col overflow-y-auto custom-scrollbar text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <div className="flex gap-1">
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Switch Language"
          >
            <Languages size={20} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Top Actions Grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center justify-center rounded-lg text-sm font-medium transition-all shadow-sm h-10 ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
              : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          title={isPlaying ? t.autoStop : t.autoDraw}
        >
          {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} />}
        </button>
        
        <button
          onClick={() => setShowGuides(!showGuides)}
          className={`flex items-center justify-center rounded-lg transition-colors h-10 ${
             showGuides 
             ? 'bg-gray-200 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-gray-300 dark:hover:bg-gray-700' 
             : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
          title={t.guides}
        >
          {showGuides ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>

        <button
          onClick={toggleCanvasControls}
          className={`flex items-center justify-center rounded-lg transition-colors h-10 ${
             !showCanvasControls
             ? 'bg-gray-200 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-gray-300 dark:hover:bg-gray-700' 
             : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
          title={t.canvasUi}
        >
          <ImageIcon size={20} />
        </button>

        <button
          onClick={onClear}
          className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors h-10"
          title={t.clear}
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="space-y-6 flex-grow">
        
        {/* Shape Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.shape}</label>
          <div className="grid grid-cols-4 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
             <button
               onClick={() => handleChange('shape', Shape.CIRCLE)}
               className={`flex items-center justify-center py-1.5 rounded-md transition-all ${params.shape === Shape.CIRCLE ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
               title={t.sCircle}
             >
               <Circle size={18} />
             </button>
             <button
               onClick={() => handleChange('shape', Shape.SQUARE)}
               className={`flex items-center justify-center py-1.5 rounded-md transition-all ${params.shape === Shape.SQUARE ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
               title={t.sSquare}
             >
               <Square size={18} />
             </button>
             <button
               onClick={() => handleChange('shape', Shape.TRIANGLE)}
               className={`flex items-center justify-center py-1.5 rounded-md transition-all ${params.shape === Shape.TRIANGLE ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
               title={t.sTriangle}
             >
               <Triangle size={18} />
             </button>
             <button
               onClick={() => handleChange('shape', Shape.STADIUM)}
               className={`flex items-center justify-center py-1.5 rounded-md transition-all ${params.shape === Shape.STADIUM ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
               title={t.sStadium}
             >
               <Minus size={18} className="rotate-45" />
             </button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.gearType}</label>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => handleChange('mode', Mode.INNER)}
              className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                params.mode === Mode.INNER 
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.inner}
            </button>
            <button
              onClick={() => handleChange('mode', Mode.OUTER)}
              className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                params.mode === Mode.OUTER 
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.outer}
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">{t.fixedRadius}</label>
              <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{params.R}</span>
            </div>
            <input
              type="range"
              min="30"
              max="400"
              value={params.R}
              onChange={(e) => handleChange('R', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          
          {params.shape === Shape.STADIUM && (
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">{t.elongation}</label>
                <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{params.elongation.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={params.elongation}
                onChange={(e) => handleChange('elongation', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">{t.movingRadius}</label>
              <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{params.r}</span>
            </div>
            <input
              type="range"
              min="2"
              max="300"
              value={params.r}
              onChange={(e) => handleChange('r', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">{t.penOffset}</label>
              <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{params.d}</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={params.d}
              onChange={(e) => handleChange('d', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">{t.thickness}</label>
              <span className="text-sm font-mono text-purple-600 dark:text-purple-400">{params.strokeWidth}px</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="40"
              step="0.5"
              value={params.strokeWidth}
              onChange={(e) => handleChange('strokeWidth', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600 dark:text-gray-300">{t.speed}</label>
              <span className="text-sm font-mono text-purple-600 dark:text-purple-400">{params.speed}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={params.speed}
              onChange={(e) => handleChange('speed', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>

        {/* Color Picker - Redesigned */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t.penColor}</label>
          
          {/* Current Color Information Panel */}
          <div className="flex items-center justify-between mb-3 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
             {/* Left: Hex Code or Rainbow Label */}
             <span className="font-mono text-gray-900 dark:text-white text-sm font-semibold pl-2 uppercase">
               {isRainbow ? t.rainbow : params.color}
             </span>
             
             {/* Right: Color Preview (Clickable for System Picker) */}
             <div 
               className={`relative w-16 h-8 rounded shadow-sm border border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all`}
               title="Click to open system color picker"
               style={isRainbow 
                 ? { background: `linear-gradient(to right, ${RAINBOW_GRADIENT_STOPS})` } 
                 : { backgroundColor: params.color }
               }
             >
                {!isRainbow && (
                  <input 
                    type="color" 
                    value={params.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                  />
                )}
                {/* If rainbow, we still render input but value is dummy to prevent crash. Selection overrides rainbow. */}
                {isRainbow && (
                  <input 
                    type="color" 
                    value="#ffffff"
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                  />
                )}
             </div>
          </div>

          {/* Spectrum Bar (Interactive) */}
          <div className="mb-3">
            <div 
              ref={spectrumRef}
              className="h-8 w-full rounded cursor-crosshair relative shadow-sm border border-gray-200 dark:border-gray-600 touch-none ring-1 ring-black/5"
              style={{ background: `linear-gradient(to right, ${RAINBOW_GRADIENT_STOPS})` }}
              onMouseDown={(e) => {
                setIsDraggingSpectrum(true);
                handleSpectrumChange(e);
              }}
              onMouseMove={(e) => {
                if (isDraggingSpectrum) handleSpectrumChange(e);
              }}
              onMouseUp={() => setIsDraggingSpectrum(false)}
              onMouseLeave={() => setIsDraggingSpectrum(false)}
              onTouchStart={(e) => {
                setIsDraggingSpectrum(true);
                handleSpectrumChange(e);
              }}
              onTouchMove={(e) => {
                if (isDraggingSpectrum) handleSpectrumChange(e);
              }}
              onTouchEnd={() => setIsDraggingSpectrum(false)}
            />
          </div>

          {/* Color Palette Buttons */}
          <div className="flex gap-2 flex-wrap justify-start">
             {/* Rainbow Button (Color Wheel) */}
             <button
                onClick={() => handleChange('color', 'rainbow')}
                className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all hover:scale-110 active:scale-95 ${
                  isRainbow
                    ? 'border-indigo-500 dark:border-white scale-110 ring-2 ring-indigo-200 dark:ring-gray-500' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}
                style={{ background: `conic-gradient(from 0deg, ${RAINBOW_GRADIENT_STOPS})` }}
                title={t.rainbow}
             />

             {colorPresets.map(c => (
               <button
                key={c}
                onClick={() => handleChange('color', c)}
                className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all hover:scale-110 active:scale-95 ${
                  params.color.toLowerCase() === c.toLowerCase()
                    ? 'border-indigo-500 dark:border-white scale-110 ring-2 ring-indigo-200 dark:ring-gray-500' 
                    : 'border-gray-200 dark:border-transparent'
                }`}
                style={{ backgroundColor: c }}
                title={c}
               />
             ))}
          </div>
        </div>

        {/* Reverse Gear Toggle */}
        <div className="flex items-center gap-2 pt-2 pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={params.isReverseGear || false} 
                  onChange={(e) => handleChange('isReverseGear', e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-orange-500 peer-focus:ring-2 peer-focus:ring-orange-300 transition-colors" />
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                 <RotateCcw size={14} />
                 {t.reverseGear}
              </div>
            </label>
        </div>
      </div>

      {/* Randomizer Generation */}
      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{t.aiTitle}</h3>
          <Wand2 size={16} className="text-indigo-500 dark:text-indigo-400" />
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {t.aiDesc}
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm"
        >
          {t.surprise}
        </button>
      </div>

      {/* Share Button (New Location) */}
      <div className="mt-4">
        <button
          onClick={handleShareClick}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-all flex justify-center items-center gap-2 relative overflow-hidden group"
          title={t.share}
        >
          <div className={`flex items-center gap-2 transition-all duration-300 ${showCopied ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <Share2 size={16} />
            {t.shareBtn}
          </div>
          
          <div className={`absolute inset-0 flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-bold transition-all duration-300 ${showCopied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <Check size={18} />
            {t.copied}
          </div>
        </button>
      </div>

      {/* Library / Saved Presets (Moved to bottom) */}
      <div className="mt-6 mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <FolderOpen size={16} />
            {t.library}
          </div>
          
          <div className="flex gap-2 mb-3">
            <input 
              type="text" 
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t.savePlaceholder}
              className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 dark:text-white"
            />
            <button 
              onClick={handleSaveClick}
              disabled={!presetName.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded text-sm transition-colors flex items-center"
              title={t.save}
            >
              <Save size={16} />
            </button>
          </div>

          {presets.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center justify-between group p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                  <button 
                    onClick={() => onLoadPreset(preset.params)}
                    className="flex-1 text-left text-sm text-gray-600 dark:text-gray-400 truncate hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {preset.name}
                  </button>
                  <button 
                    onClick={() => onDeletePreset(preset.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
      </div>

    </div>
  );
};

export default ControlPanel;
import React, { useState } from 'react';
import { Mode, SpirographParams, Language, Shape, PatternPreset, SavedSpirographParams } from '../types';
import { Play, Trash2, Wand2, Sun, Moon, Languages, Circle, Square, Triangle, Minus, Eye, EyeOff, Fingerprint, Share2, Check, Save, FolderOpen, X } from 'lucide-react';

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
}

const translations = {
  en: {
    title: "Cosmic Spirograph",
    autoDraw: "Auto Draw",
    autoStop: "Stop Auto",
    clear: "Clear Canvas",
    guides: "Toggle Guides",
    share: "Share / Save URL",
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
    aiTitle: "Randomizer",
    aiDesc: "Generate a random geometric configuration.",
    surprise: "Surprise Me",
    library: "Library",
    savePlaceholder: "Pattern Name...",
    save: "Save",
    load: "Load",
  },
  zh: {
    title: "宇宙萬花尺",
    autoDraw: "自動繪製",
    autoStop: "停止自動",
    clear: "清除畫布",
    guides: "顯示/隱藏尺規",
    share: "分享 / 儲存網址",
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
    aiTitle: "隨機產生器",
    aiDesc: "隨機產生一組幾何參數配置。",
    surprise: "幫我設計 (Surprise Me)",
    library: "圖案庫",
    savePlaceholder: "輸入名稱...",
    save: "儲存",
    load: "載入",
  }
};

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
  onLoadPreset
}) => {
  const t = translations[language];
  const [showCopied, setShowCopied] = useState(false);
  const [presetName, setPresetName] = useState('');

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

  return (
    <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-l border-gray-200 dark:border-gray-800 p-6 flex flex-col h-full overflow-y-auto shadow-xl z-10 text-gray-900 dark:text-gray-100 transition-colors duration-300">
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

      {/* Secondary Actions */}
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
          onClick={handleShareClick}
          className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors h-10 relative"
          title={t.share}
        >
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${showCopied ? 'opacity-100' : 'opacity-0'}`}>
            <Check size={20} className="text-green-500" />
          </div>
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${showCopied ? 'opacity-0' : 'opacity-100'}`}>
            <Share2 size={20} />
          </div>
        </button>

        <button
          onClick={onClear}
          className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors h-10"
          title={t.clear}
        >
          <Trash2 size={20} />
        </button>
      </div>
      
      {/* Copied Feedback Text */}
      {showCopied && (
        <div className="text-center text-xs font-medium text-green-600 dark:text-green-400 -mt-4 mb-4 animate-pulse">
          {t.copied}
        </div>
      )}

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
              max="200"
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
              max="150"
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
              max="150"
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
              max="20"
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

        {/* Color Picker */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t.penColor}</label>
          <div className="flex gap-2 flex-wrap">
             {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000'].map(c => (
               <button
                key={c}
                onClick={() => handleChange('color', c)}
                className={`w-8 h-8 rounded-full border-2 shadow-sm ${
                  params.color === c 
                    ? 'border-indigo-500 dark:border-white scale-110' 
                    : 'border-gray-200 dark:border-transparent hover:scale-110'
                } transition-all`}
                style={{ backgroundColor: c }}
                title={c}
               />
             ))}
             <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm hover:scale-110 transition-transform">
               <input 
                 type="color" 
                 value={params.color}
                 onChange={(e) => handleChange('color', e.target.value)}
                 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-0 cursor-pointer"
               />
             </div>
          </div>
        </div>
      </div>

      {/* Randomizer Generation */}
      <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
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
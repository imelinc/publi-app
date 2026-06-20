'use client'

import { SlidersHorizontal, Sun, Palette } from 'lucide-react'
import type { ActiveObjectInfo } from './useFabricCanvas'

interface ImageFilterControlsProps {
  objectInfo: ActiveObjectInfo
  onApplyFilter: (
    filterType: 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast',
    value: number | boolean
  ) => void
}

export function ImageFilterControls({
  objectInfo,
  onApplyFilter,
}: ImageFilterControlsProps) {
  const filters = objectInfo.filters || {
    grayscale: false,
    sepia: false,
    invert: false,
    blur: 0,
    brightness: 0,
    contrast: 0,
  }

  return (
    <div className="premium-card p-4 space-y-4 border border-slate-100/50">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100/50">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#0095b6]" />
          <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider">
            Filtros
          </h4>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold tracking-wide uppercase">
          Efectos
        </span>
      </div>

      {/* Quick Filters */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          Filtros Rápidos
        </p>
        <div className="grid grid-cols-3 gap-2">
          {/* Grayscale */}
          <button
            onClick={() => onApplyFilter('grayscale', !filters.grayscale)}
            className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all duration-200 shadow-xs cursor-pointer hover:scale-[1.04] active:scale-[0.96] ${
              filters.grayscale
                ? 'bg-primary/10 border-primary/20 text-primary font-bold'
                : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            B&N
          </button>

          {/* Sepia */}
          <button
            onClick={() => onApplyFilter('sepia', !filters.sepia)}
            className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all duration-200 shadow-xs cursor-pointer hover:scale-[1.04] active:scale-[0.96] ${
              filters.sepia
                ? 'bg-primary/10 border-primary/20 text-primary font-bold'
                : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            Sepia
          </button>

          {/* Invert */}
          <button
            onClick={() => onApplyFilter('invert', !filters.invert)}
            className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all duration-200 shadow-xs cursor-pointer hover:scale-[1.04] active:scale-[0.96] ${
              filters.invert
                ? 'bg-primary/10 border-primary/20 text-primary font-bold'
                : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            Invertir
          </button>
        </div>
      </div>

      <div className="w-full h-[1px] bg-slate-100/80 my-2" />

      {/* Precision Sliders */}
      <div className="space-y-3.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-slate-400" />
          Ajustes Precisos
        </p>

        {/* Brightness Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Brillo</span>
            <span className="text-[#0095b6] font-semibold">{Math.round(filters.brightness * 100)}%</span>
          </div>
          <input
            type="range"
            min="-0.5"
            max="0.5"
            step="0.05"
            value={filters.brightness}
            onChange={(e) => onApplyFilter('brightness', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0095b6] hover:accent-[#00b4d8] transition-all"
          />
        </div>

        {/* Contrast Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Contraste</span>
            <span className="text-[#0095b6] font-semibold">{Math.round(filters.contrast * 100)}%</span>
          </div>
          <input
            type="range"
            min="-0.5"
            max="0.5"
            step="0.05"
            value={filters.contrast}
            onChange={(e) => onApplyFilter('contrast', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0095b6] hover:accent-[#00b4d8] transition-all"
          />
        </div>

        {/* Blur Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Desenfoque (Blur)</span>
            <span className="text-[#0095b6] font-semibold">{Math.round(filters.blur * 10)}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={filters.blur}
            onChange={(e) => onApplyFilter('blur', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0095b6] hover:accent-[#00b4d8] transition-all"
          />
        </div>
      </div>
    </div>
  )
}

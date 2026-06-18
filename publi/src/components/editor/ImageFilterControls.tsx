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
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-gray-50">
        <SlidersHorizontal className="w-4 h-4 text-[#0095b6]" />
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Ajustes de Imagen
        </h4>
      </div>

      {/* Quick Filters */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          Filtros Rápidos
        </p>
        <div className="grid grid-cols-3 gap-2">
          {/* Grayscale */}
          <button
            onClick={() => onApplyFilter('grayscale', !filters.grayscale)}
            className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all duration-200 ${
              filters.grayscale
                ? 'bg-[#cceef5]/70 border-[#0095b6]/30 text-[#0095b6]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            B&N
          </button>

          {/* Sepia */}
          <button
            onClick={() => onApplyFilter('sepia', !filters.sepia)}
            className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all duration-200 ${
              filters.sepia
                ? 'bg-[#cceef5]/70 border-[#0095b6]/30 text-[#0095b6]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sepia
          </button>

          {/* Invert */}
          <button
            onClick={() => onApplyFilter('invert', !filters.invert)}
            className={`py-1.5 px-1.5 text-[10px] font-semibold rounded-lg border transition-all duration-200 ${
              filters.invert
                ? 'bg-[#cceef5]/70 border-[#0095b6]/30 text-[#0095b6]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Invertir
          </button>
        </div>
      </div>

      <div className="w-full h-[1px] bg-slate-100 my-2" />

      {/* Precision Sliders */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5" />
          Ajustes Precisos
        </p>

        {/* Brightness Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-600">
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
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0095b6]"
          />
        </div>

        {/* Contrast Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-600">
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
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0095b6]"
          />
        </div>

        {/* Blur Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-600">
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
            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0095b6]"
          />
        </div>
      </div>
    </div>
  )
}

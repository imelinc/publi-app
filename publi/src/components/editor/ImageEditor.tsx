'use client'

import { useRef, useState } from 'react'
import { useFabricCanvas } from './useFabricCanvas'
import { EditorToolbar } from './EditorToolbar'
import { TextControls } from './TextControls'
import { ColorPicker } from './ColorPicker'
import { ImageFilterControls } from './ImageFilterControls'
import { Eye, EyeOff, Layout, ChevronDown, HelpCircle } from 'lucide-react'

interface ImageEditorProps {
  width: number
  height: number
  backgroundColor: string
  backgroundImage?: string | null
}

export function ImageEditor({
  width,
  height,
  backgroundColor,
  backgroundImage,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentBgColor, setCurrentBgColor] = useState(backgroundColor)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const {
    displayWidth,
    displayHeight,
    contentWidth,
    contentHeight,
    changeDimensions,
    applyImageFilter,
    addText,
    addShape,
    addSticker,
    addUploadedImage,
    deleteSelected,
    duplicateSelected,
    bringToFront,
    sendToBack,
    exportToPNG,
    activeObjectInfo,
    updateActiveObjectProp,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFabricCanvas(canvasRef, {
    width,
    height,
    backgroundColor: currentBgColor,
    backgroundImage: backgroundImage ?? null,
  })

  const [showSafeZones, setShowSafeZones] = useState(false)
  const [showFormatDropdown, setShowFormatDropdown] = useState(false)

  const FORMATS = [
    { name: 'Instagram Feed (1:1)', width: 1080, height: 1080 },
    { name: 'Instagram Story (9:16)', width: 1080, height: 1920 },
    { name: 'Instagram Portrait (4:5)', width: 1080, height: 1350 },
    { name: 'Banner Horizontal (16:9)', width: 1200, height: 675 },
  ]

  const currentFormat = FORMATS.find(
    (f) => f.width === contentWidth && f.height === contentHeight
  ) || { name: 'Personalizado', width: contentWidth, height: contentHeight }

  return (
    <div className="flex gap-4 h-full items-start">
      {/* Local style block to completely remove default browser outlines/borders on the canvas container */}
      <style dangerouslySetInnerHTML={{ __html: `
        .canvas-container, .canvas-container:focus, canvas, canvas:focus {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
      ` }} />

      {/* Left toolbar */}
      <EditorToolbar
        onAddText={addText}
        onAddShape={addShape}
        onAddSticker={addSticker}
        onUploadImage={addUploadedImage}
        onDelete={deleteSelected}
        onDuplicate={duplicateSelected}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onExport={exportToPNG}
        activeObjectInfo={activeObjectInfo}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Canvas area */}
      <div className="flex-1 flex flex-col gap-3 h-[640px]">
        {/* Canvas Top Bar Controls */}
        <div className="relative z-10 flex justify-between items-center bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/80 p-2 shadow-sm px-4 shrink-0">
          {/* Format Resizer */}
          <div className="relative">
            <button
              onClick={() => setShowFormatDropdown((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Layout className="w-3.5 h-3.5 text-[#0095b6]" />
              <span>Formato: {currentFormat.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFormatDropdown && (
              <div className="absolute left-0 mt-1.5 w-[210px] bg-white rounded-xl border border-slate-100 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {FORMATS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => {
                      changeDimensions(f.width, f.height)
                      setShowFormatDropdown(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-slate-50 text-left ${
                      contentWidth === f.width && contentHeight === f.height
                        ? 'text-[#0095b6] font-semibold bg-[#cceef5]/20'
                        : 'text-slate-600'
                    }`}
                  >
                    <span>{f.name}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{f.width}×{f.height}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Guides and Help Buttons */}
          <div className="flex items-center gap-2">
            {/* Safe Zones Toggle */}
            <button
              onClick={() => setShowSafeZones((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                showSafeZones
                  ? 'bg-[#cceef5]/70 border-[#0095b6]/30 text-[#0095b6]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showSafeZones ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Guías: Activas</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Guías: Ocultas</span>
                </>
              )}
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
              title="Atajos de teclado"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Ayuda</span>
            </button>
          </div>
        </div>

        {/* Centered Canvas Container */}
        <div className="flex-1 flex items-center justify-center bg-[#f5f0e8] rounded-xl border border-slate-100 overflow-hidden relative">
          {/* Centered wrapper for visual page card (without border as requested) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-lg shadow-lg shrink-0"
              style={{
                width: displayWidth,
                height: displayHeight,
                backgroundColor: currentBgColor,
              }}
            />
          </div>

          {/* Full-size Canvas Wrapper spanning the entire beige container */}
          <div className="absolute inset-0 w-full h-full">
            <canvas ref={canvasRef} />
          </div>

          {/* Safe Zone Overlay aligned with the card centering */}
          {showSafeZones && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
              <div 
                className="shrink-0"
                style={{
                  width: displayWidth,
                  height: displayHeight,
                }}
              >
                {contentWidth === 1080 && contentHeight === 1920 ? (
                  <div className="w-full h-full flex flex-col justify-between">
                    <div className="h-[15%] w-full border-b border-dashed border-rose-400 bg-rose-500/5 flex items-center justify-between px-3 text-rose-500 text-[8px] font-semibold tracking-wider uppercase">
                      <span>Zona IG Story: Cabecera</span>
                      <span>Evitar texto</span>
                    </div>
                    <div className="h-[15%] w-full border-t border-dashed border-rose-400 bg-rose-500/5 flex items-center justify-between px-3 text-rose-500 text-[8px] font-semibold tracking-wider uppercase">
                      <span>Zona IG Story: Mensajes</span>
                      <span>Evitar texto</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full p-4">
                    <div className="w-full h-full border border-dashed border-slate-300 bg-slate-500/5 flex items-end justify-end p-2 text-[8px] font-semibold text-slate-400 tracking-wider uppercase">
                      <span>Margen de seguridad</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — contextual controls */}
      <div className="w-[220px] shrink-0 space-y-3">
        {activeObjectInfo?.type === 'textbox' && (
          <TextControls
            objectInfo={activeObjectInfo}
            onUpdate={updateActiveObjectProp}
          />
        )}

        {activeObjectInfo?.type === 'shape' && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Forma
            </h4>
            <ColorPicker
              label="Color de relleno"
              value={activeObjectInfo.fill}
              onChange={(c) => updateActiveObjectProp('fill', c)}
            />
          </div>
        )}

        {activeObjectInfo?.type === 'image' && (
          <ImageFilterControls
            objectInfo={activeObjectInfo}
            onApplyFilter={applyImageFilter}
          />
        )}

        {!activeObjectInfo && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Lienzo
            </h4>
            <ColorPicker
              label="Color de fondo"
              value={currentBgColor}
              onChange={(c) => setCurrentBgColor(c)}
            />
          </div>
        )}

        {/* Canvas info */}
        <div className="bg-white/60 rounded-xl border border-gray-100 p-3">
          <p className="text-[10px] text-gray-400 text-center">
            Canvas: {contentWidth} × {contentHeight}px
          </p>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl max-w-sm w-full space-y-4 mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0095b6]" />
                Atajos de teclado
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Cerrar
              </button>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mover selección</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] text-slate-700">Flechas ↑ ↓ ← →</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mover rápido (x10)</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] text-slate-700">Shift + Flechas</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Copiar elemento</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] text-slate-700">Ctrl/Cmd + C</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pegar elemento</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] text-slate-700">Ctrl/Cmd + V</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Deshacer cambio</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] text-slate-700">Ctrl/Cmd + Z</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Rehacer cambio</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] text-slate-700">Ctrl/Cmd + Y</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Eliminar elemento</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded font-semibold text-[10px] text-slate-700">Supr / Backspace</kbd>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center pt-2">
              Hacé clic en el fondo beige para deseleccionar objetos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

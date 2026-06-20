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
        <div className="relative z-10 flex justify-between items-center bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-150/40 p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] px-4 shrink-0">
          {/* Format Resizer */}
          <div className="relative">
            <button
              onClick={() => setShowFormatDropdown((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/85 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-350 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <Layout className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
              <span>Formato: {currentFormat.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-450" />
            </button>

            {showFormatDropdown && (
              <div className="absolute left-0 mt-2.5 w-[220px] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-[0_12px_38px_rgba(0,0,0,0.08)] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {FORMATS.map((f) => {
                  const isSelected = contentWidth === f.width && contentHeight === f.height
                  return (
                    <button
                      key={f.name}
                      onClick={() => {
                        changeDimensions(f.width, f.height)
                        setShowFormatDropdown(false)
                      }}
                      className={`w-[calc(100%-12px)] mx-1.5 flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all text-left cursor-pointer hover:bg-slate-50 ${
                        isSelected
                          ? 'text-primary font-bold bg-primary/10'
                          : 'text-slate-650 hover:text-slate-800'
                      }`}
                    >
                      <span>{f.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono">{f.width}×{f.height}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Guides and Help Buttons */}
          <div className="flex items-center gap-2">
            {/* Safe Zones Toggle */}
            <button
              onClick={() => setShowSafeZones((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs ${
                showSafeZones
                  ? 'bg-primary/10 border-primary/20 text-primary shadow-xs'
                  : 'border-slate-200 bg-white text-slate-605 hover:bg-slate-50 hover:text-slate-850'
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-850 hover:scale-[1.02] active:scale-[0.98] text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Atajos de teclado"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-450" />
              <span>Ayuda</span>
            </button>
          </div>
        </div>

        {/* Centered Canvas Container */}
        <div className="flex-1 flex items-center justify-center bg-[#f6f5f2] bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] rounded-2xl border border-slate-150/40 overflow-hidden relative shadow-inner">
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
          <div className="premium-card p-4 border border-slate-100/50 space-y-4">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Forma
              </h4>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold tracking-wide uppercase">
                Objeto
              </span>
            </div>
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
          <div className="premium-card p-4 border border-slate-100/50 space-y-4">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Lienzo
              </h4>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold tracking-wide uppercase">
                Ajustes
              </span>
            </div>
            <ColorPicker
              label="Color de fondo"
              value={currentBgColor}
              onChange={(c) => setCurrentBgColor(c)}
            />
          </div>
        )}

        {/* Canvas info */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-150/40 p-2.5 shadow-xs">
          <p className="text-[10px] text-slate-550 text-center font-bold tracking-wide">
            Lienzo: <span className="font-mono text-slate-700">{contentWidth} × {contentHeight}px</span>
          </p>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-slate-105 p-6 shadow-[0_32px_64px_rgba(0,0,0,0.16)] max-w-sm w-full space-y-5 mx-4 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>Atajos de teclado</span>
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-xs text-slate-400 hover:text-slate-750 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              {[
                { desc: 'Mover selección', keys: 'Flechas ↑ ↓ ← →' },
                { desc: 'Mover rápido (x10)', keys: 'Shift + Flechas' },
                { desc: 'Copiar elemento', keys: 'Ctrl/Cmd + C' },
                { desc: 'Pegar elemento', keys: 'Ctrl/Cmd + V' },
                { desc: 'Deshacer cambio', keys: 'Ctrl/Cmd + Z' },
                { desc: 'Rehacer cambio', keys: 'Ctrl/Cmd + Y' },
                { desc: 'Eliminar elemento', keys: 'Supr / Backspace' },
              ].map((item) => (
                <div key={item.desc} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-semibold">{item.desc}</span>
                  <kbd className="px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-xl font-bold font-mono text-[9px] text-slate-650 shadow-2xs">
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-center">
              <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                Hacé clic en el fondo gris para deseleccionar objetos y guardar cambios.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

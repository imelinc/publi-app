'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Crop, Maximize2, Minimize2 } from 'lucide-react'

type AspectRatio = '1:1' | '4:5' | '16:9'

interface CropDialogProps {
  isOpen: boolean
  imageUrl: string
  onClose: () => void
  onCropComplete: (croppedBlob: Blob) => void
}

export function CropDialog({
  isOpen,
  imageUrl,
  onClose,
  onCropComplete,
}: CropDialogProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // Dimensions of the crop box in the UI (fixed width, height varies by ratio)
  const boxWidth = 320
  const boxHeight =
    aspectRatio === '1:1' ? 320 : aspectRatio === '4:5' ? 400 : 180

  // Reset parameters when image or aspect ratio changes
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [imageUrl, aspectRatio])

  // Get initial fitted size of the image inside the crop box
  function getFittedSize() {
    if (naturalSize.width === 0 || naturalSize.height === 0) {
      return { width: 0, height: 0 }
    }
    const boxRatio = boxWidth / boxHeight
    const imgRatio = naturalSize.width / naturalSize.height

    if (imgRatio > boxRatio) {
      // Fit height
      return {
        width: boxHeight * imgRatio,
        height: boxHeight,
      }
    } else {
      // Fit width
      return {
        width: boxWidth,
        height: boxWidth / imgRatio,
      }
    }
  }

  const fitted = getFittedSize()
  const scaledWidth = fitted.width * zoom
  const scaledHeight = fitted.height * zoom

  // Limit X and Y panning to prevent showing empty space
  const limitX = Math.max(0, (scaledWidth - boxWidth) / 2)
  const limitY = Math.max(0, (scaledHeight - boxHeight) / 2)

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const x = e.clientX - dragStartRef.current.x
    const y = e.clientY - dragStartRef.current.y

    // Constrain pan
    setPan({
      x: Math.max(-limitX, Math.min(limitX, x)),
      y: Math.max(-limitY, Math.min(limitY, y)),
    })
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    setIsDragging(true)
    const touch = e.touches[0]
    dragStartRef.current = {
      x: touch.clientX - pan.x,
      y: touch.clientY - pan.y,
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    const x = touch.clientX - dragStartRef.current.x
    const y = touch.clientY - dragStartRef.current.y

    setPan({
      x: Math.max(-limitX, Math.min(limitX, x)),
      y: Math.max(-limitY, Math.min(limitY, y)),
    })
  }

  const handleApplyCrop = async () => {
    if (!imgRef.current || naturalSize.width === 0) return
    setProcessing(true)

    try {
      // Target resolution
      let destWidth = 1080
      let destHeight = 1080
      if (aspectRatio === '4:5') {
        destHeight = 1350
      } else if (aspectRatio === '16:9') {
        destHeight = 608
      }

      const canvas = document.createElement('canvas')
      canvas.width = destWidth
      canvas.height = destHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Could not get canvas context')

      const img = imgRef.current

      // Calculate source crop dimensions on the natural image
      const xTopLeft = (boxWidth - scaledWidth) / 2 + pan.x
      const yTopLeft = (boxHeight - scaledHeight) / 2 + pan.y

      const sx = -xTopLeft * (naturalSize.width / scaledWidth)
      const sy = -yTopLeft * (naturalSize.height / scaledHeight)
      const sw = boxWidth * (naturalSize.width / scaledWidth)
      const sh = boxHeight * (naturalSize.height / scaledHeight)

      // Draw the cropped portion to canvas
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, destWidth, destHeight)

      // Export as Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob)
          } else {
            console.error('Blob generation failed')
          }
          setProcessing(false)
        },
        'image/jpeg',
        0.9 // high quality
      )
    } catch (err) {
      console.error('Cropping error:', err)
      setProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !processing && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-[#0095b6]" />
            Encuadrar imagen
          </DialogTitle>
          <DialogDescription>
            Ajustá el encuadre de la foto arrastrándola y usando el slider de zoom para que se vea perfecta en Instagram.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Aspect Ratio Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 w-full max-w-xs justify-between">
            {(['1:1', '4:5', '16:9'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  aspectRatio === ratio
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {ratio === '1:1'
                  ? '1:1 (Cuadrado)'
                  : ratio === '4:5'
                  ? '4:5 (Retrato)'
                  : '16:9 (Horizontal)'}
              </button>
            ))}
          </div>

          {/* Interactive Crop Container */}
          <div
            ref={containerRef}
            className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center cursor-move select-none"
            style={{
              width: `${boxWidth}px`,
              height: `${boxHeight}px`,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
          >
            {/* Aspect Ratio Guide Box (Border) */}
            <div className="absolute inset-0 border-2 border-white pointer-events-none z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />

            {/* Crosshair guidelines */}
            <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="To crop"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute max-w-none transition-none select-none"
              style={{
                width: fitted.width > 0 ? `${scaledWidth}px` : 'auto',
                height: fitted.height > 0 ? `${scaledHeight}px` : 'auto',
                transform: `translate(${pan.x}px, ${pan.y}px)`,
              }}
            />
          </div>

          {/* Zoom Control */}
          <div className="w-full space-y-2 px-4">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <Minimize2 className="w-3.5 h-3.5" /> Zoom
              </span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => {
                const z = parseFloat(e.target.value)
                setZoom(z)
                // When zooming out, restrict pan immediately if it overflows
                const fitSize = getFittedSize()
                const wScaled = fitSize.width * z
                const hScaled = fitSize.height * z
                const limX = Math.max(0, (wScaled - boxWidth) / 2)
                const limY = Math.max(0, (hScaled - boxHeight) / 2)
                setPan((prev) => ({
                  x: Math.max(-limX, Math.min(limX, prev.x)),
                  y: Math.max(-limY, Math.min(limY, prev.y)),
                }))
              }}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0095b6] outline-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApplyCrop}
            disabled={processing || naturalSize.width === 0}
            className="bg-[#0095b6] hover:bg-[#007a94] text-white"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Aplicando...
              </>
            ) : (
              'Aplicar encuadre'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

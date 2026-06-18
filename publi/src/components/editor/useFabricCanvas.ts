'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Canvas,
  Rect,
  Circle,
  Textbox,
  FabricImage,
  Line,
  Triangle,
  Group,
  loadSVGFromString,
  util,
  type FabricObject,
  filters,
} from 'fabric'

export type ShapeType = 'rect' | 'circle' | 'arrow' | 'line'

export interface ActiveObjectInfo {
  type: 'textbox' | 'shape' | 'image' | 'group' | 'other'
  fill: string
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  color?: string
  filters?: {
    grayscale: boolean
    sepia: boolean
    invert: boolean
    blur: number
    brightness: number
    contrast: number
  }
}

interface UseFabricCanvasOptions {
  /** Content width in pixels (e.g., 1080 for Instagram feed) */
  width: number
  /** Content height in pixels (e.g., 1080) */
  height: number
  backgroundColor: string
  /** Optional background image URL to load as non-selectable bottom layer */
  backgroundImage?: string | null
}

// Maximum display area for the canvas inside the editor layout
const MAX_DISPLAY_W = 720
const MAX_DISPLAY_H = 600

export function useFabricCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseFabricCanvasOptions
) {
  const fabricRef = useRef<Canvas | null>(null)
  const [activeObjectInfo, setActiveObjectInfo] = useState<ActiveObjectInfo | null>(null)

  // History & Keyboard state
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef<number>(-1)
  const isApplyingHistoryRef = useRef<boolean>(false)
  const clipboardRef = useRef<FabricObject | null>(null)

  // Content dimensions (the "real" resolution)
  const [contentW, setContentW] = useState(options.width)
  const [contentH, setContentH] = useState(options.height)

  // Display dimensions as React state
  const [displayWidth, setDisplayWidth] = useState(720)
  const [displayHeight, setDisplayHeight] = useState(600)
  const [displayScale, setDisplayScale] = useState(0.6)

  // Refs so callbacks can access current dimensions without stale closures
  const contentWRef = useRef(contentW)
  const contentHRef = useRef(contentH)
  const displayScaleRef = useRef(displayScale)
  const displayWRef = useRef(displayWidth)
  const displayHRef = useRef(displayHeight)
  const containerWRef = useRef(800)
  const containerHRef = useRef(640)
  contentWRef.current = contentW
  contentHRef.current = contentH
  displayScaleRef.current = displayScale
  displayWRef.current = displayWidth
  displayHRef.current = displayHeight

  // ─── History Helpers ────────────────────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || isApplyingHistoryRef.current) return

    const state = JSON.stringify(canvas.toJSON())
    const currentHistory = historyRef.current.slice(0, historyIndexRef.current + 1)

    // Avoid saving consecutive identical states
    if (currentHistory.length > 0 && currentHistory[currentHistory.length - 1] === state) {
      return
    }

    currentHistory.push(state)
    if (currentHistory.length > 30) {
      currentHistory.shift()
    }

    historyRef.current = currentHistory
    historyIndexRef.current = currentHistory.length - 1

    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || historyIndexRef.current <= 0) return

    isApplyingHistoryRef.current = true
    const prevIndex = historyIndexRef.current - 1
    const state = historyRef.current[prevIndex]

    canvas.loadFromJSON(JSON.parse(state))
      .then(() => {
        canvas.renderAll()
        historyIndexRef.current = prevIndex
        setCanUndo(prevIndex > 0)
        setCanRedo(true)
        // Sync active object info
        const active = canvas.getActiveObject()
        setActiveObjectInfo(active ? getObjectInfo(active) : null)
      })
      .catch((err) => console.error('Error loading undo state:', err))
      .finally(() => {
        isApplyingHistoryRef.current = false
      })
  }, [])

  const redo = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return

    isApplyingHistoryRef.current = true
    const nextIndex = historyIndexRef.current + 1
    const state = historyRef.current[nextIndex]

    canvas.loadFromJSON(JSON.parse(state))
      .then(() => {
        canvas.renderAll()
        historyIndexRef.current = nextIndex
        setCanUndo(true)
        setCanRedo(nextIndex < historyRef.current.length - 1)
        // Sync active object info
        const active = canvas.getActiveObject()
        setActiveObjectInfo(active ? getObjectInfo(active) : null)
      })
      .catch((err) => console.error('Error loading redo state:', err))
      .finally(() => {
        isApplyingHistoryRef.current = false
      })
  }, [])

  // ─── Clipboard (Copy/Paste) Helpers ────────────────────────────────────────
  const copy = useCallback(async () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active) return

    // Don't copy if user is actively editing a textbox
    if (active instanceof Textbox && active.isEditing) {
      return
    }

    try {
      const cloned = await active.clone()
      clipboardRef.current = cloned
    } catch (err) {
      console.error('Error copying object:', err)
    }
  }, [])

  const paste = useCallback(async () => {
    const canvas = fabricRef.current
    if (!canvas || !clipboardRef.current) return

    const active = canvas.getActiveObject()
    if (active instanceof Textbox && active.isEditing) {
      return
    }

    try {
      const cloned = await clipboardRef.current.clone()
      canvas.discardActiveObject()

      // Position the pasted object slightly offset
      cloned.set({
        left: (cloned.left ?? 0) + 20,
        top: (cloned.top ?? 0) + 20,
        evented: true,
      })

      if (cloned.type === 'activeSelection' || (cloned as any)._objects) {
        cloned.canvas = canvas
        if ('forEachObject' in cloned) {
          (cloned as any).forEachObject((obj: FabricObject) => {
            canvas.add(obj)
          })
        } else {
          canvas.add(cloned)
        }
        cloned.setCoords()
      } else {
        canvas.add(cloned)
      }

      // Update clipboard offset so successive pastes cascade
      clipboardRef.current.top = (clipboardRef.current.top ?? 0) + 20
      clipboardRef.current.left = (clipboardRef.current.left ?? 0) + 20

      canvas.setActiveObject(cloned)
      canvas.renderAll()
    } catch (err) {
      console.error('Error pasting object:', err)
    }
  }, [])

  // ─── Smart Snapping / Alignment Guides ──────────────────────────────────────
  const activeGuidelinesRef = useRef<Array<{ x1: number; y1: number; x2: number; y2: number }>>([])

  const handleObjectMoving = useCallback((canvas: Canvas, activeObj: FabricObject) => {
    const threshold = 8 // content pixels
    const guidelines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []

    const objW = (activeObj.width ?? 0) * (activeObj.scaleX ?? 1)
    const objH = (activeObj.height ?? 0) * (activeObj.scaleY ?? 1)
    const objL = activeObj.left ?? 0
    const objT = activeObj.top ?? 0
    const objR = objL + objW
    const objB = objT + objH
    const objCX = objL + objW / 2
    const objCY = objT + objH / 2

    let snapX: number | null = null
    let snapY: number | null = null

    const cw = contentWRef.current
    const ch = contentHRef.current

    // Target reference points (centers, edges of other objects, and canvas bounds)
    const targetsX = [
      { value: 0, label: 'canvas-left' },
      { value: cw / 2, label: 'canvas-center' },
      { value: cw, label: 'canvas-right' },
    ]
    const targetsY = [
      { value: 0, label: 'canvas-top' },
      { value: ch / 2, label: 'canvas-middle' },
      { value: ch, label: 'canvas-bottom' },
    ]

    // Gather coordinates from all other selectable objects
    canvas.getObjects().forEach((target) => {
      if (target === activeObj || !target.selectable) return

      const tW = (target.width ?? 0) * (target.scaleX ?? 1)
      const tH = (target.height ?? 0) * (target.scaleY ?? 1)
      const tL = target.left ?? 0
      const tT = target.top ?? 0
      const tR = tL + tW
      const tB = tT + tH
      const tCX = tL + tW / 2
      const tCY = tT + tH / 2

      targetsX.push(
        { value: tL, label: 'left' },
        { value: tCX, label: 'center' },
        { value: tR, label: 'right' }
      )
      targetsY.push(
        { value: tT, label: 'top' },
        { value: tCY, label: 'middle' },
        { value: tB, label: 'bottom' }
      )
    })

    // Check vertical alignments (matching X coordinates)
    for (const t of targetsX) {
      if (Math.abs(objCX - t.value) < threshold) {
        snapX = t.value - objW / 2
        guidelines.push({ x1: t.value, y1: 0, x2: t.value, y2: ch })
        break
      }
      if (Math.abs(objL - t.value) < threshold) {
        snapX = t.value
        guidelines.push({ x1: t.value, y1: 0, x2: t.value, y2: ch })
        break
      }
      if (Math.abs(objR - t.value) < threshold) {
        snapX = t.value - objW
        guidelines.push({ x1: t.value, y1: 0, x2: t.value, y2: ch })
        break
      }
    }

    // Check horizontal alignments (matching Y coordinates)
    for (const t of targetsY) {
      if (Math.abs(objCY - t.value) < threshold) {
        snapY = t.value - objH / 2
        guidelines.push({ x1: 0, y1: t.value, x2: cw, y2: t.value })
        break
      }
      if (Math.abs(objT - t.value) < threshold) {
        snapY = t.value
        guidelines.push({ x1: 0, y1: t.value, x2: cw, y2: t.value })
        break
      }
      if (Math.abs(objB - t.value) < threshold) {
        snapY = t.value - objH
        guidelines.push({ x1: 0, y1: t.value, x2: cw, y2: t.value })
        break
      }
    }

    if (snapX !== null) {
      activeObj.set({ left: snapX })
    }
    if (snapY !== null) {
      activeObj.set({ top: snapY })
    }

    activeGuidelinesRef.current = guidelines
    canvas.requestRenderAll()
  }, [])

  const clearGuidelines = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    if (activeGuidelinesRef.current.length > 0) {
      activeGuidelinesRef.current = []
      canvas.requestRenderAll()
    }
  }, [])

  // ─── Init & cleanup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return
    const container = parent.parentElement
    if (!container) return

    // Measure container dimension to make viewport as large as possible with 10% spacing margins
    const displayW = container.clientWidth || 800
    const displayH = container.clientHeight || 640

    const initW = options.width
    const initH = options.height

    const scale = Math.min((displayW * 0.8) / initW, (displayH * 0.8) / initH, 1)
    const finalW = Math.round(initW * scale)
    const finalH = Math.round(initH * scale)

    setDisplayWidth(finalW)
    setDisplayHeight(finalH)
    setDisplayScale(scale)

    displayWRef.current = finalW
    displayHRef.current = finalH
    displayScaleRef.current = scale

    containerWRef.current = displayW
    containerHRef.current = displayH

    const offsetX = (displayW - finalW) / 2
    const offsetY = (displayH - finalH) / 2

    // Create the canvas exactly matching the container dimensions
    const canvas = new Canvas(el, {
      width: displayW,
      height: displayH,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    })

    canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY])
    fabricRef.current = canvas

    // Initialize/reset history refs
    historyRef.current = []
    historyIndexRef.current = -1

    // Load background image if provided
    if (options.backgroundImage) {
      FabricImage.fromURL(options.backgroundImage)
        .then((img) => {
          const scaleImg = Math.min(initW / (img.width ?? initW), initH / (img.height ?? initH))
          img.set({
            left: (initW - (img.width ?? initW) * scaleImg) / 2,
            top: (initH - (img.height ?? initH) * scaleImg) / 2,
            scaleX: scaleImg,
            scaleY: scaleImg,
            selectable: false,
            evented: false,
          })
          canvas.insertAt(0, img)
          canvas.renderAll()
          saveHistory()
        })
        .catch((err) => {
          console.error('Error loading background image:', err)
          saveHistory()
        })
    } else {
      saveHistory()
    }

    // Sync active object info → React state
    const syncSelection = () => {
      const obj = canvas.getActiveObject()
      if (!obj) {
        setActiveObjectInfo(null)
        return
      }
      setActiveObjectInfo(getObjectInfo(obj))
    }

    canvas.on('selection:created', syncSelection)
    canvas.on('selection:updated', syncSelection)
    canvas.on('selection:cleared', () => setActiveObjectInfo(null))
    canvas.on('object:modified', syncSelection)

    // Hook up Smart Snapping / Alignment Guides
    canvas.on('object:moving', (e) => {
      if (e.target) handleObjectMoving(canvas, e.target)
    })
    canvas.on('object:modified', clearGuidelines)
    canvas.on('selection:cleared', clearGuidelines)
    canvas.on('mouse:up', clearGuidelines)

    // Render guidelines inside after:render
    canvas.on('after:render', () => {
      const ctx = canvas.getContext()
      if (!ctx) return
      ctx.save()

      const vt = canvas.viewportTransform
      if (!vt) {
        ctx.restore()
        return
      }

      ctx.strokeStyle = '#0095b6' // publi color
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])

      activeGuidelinesRef.current.forEach((line) => {
        const x1 = line.x1 * vt[0] + vt[4]
        const y1 = line.y1 * vt[3] + vt[5]
        const x2 = line.x2 * vt[0] + vt[4]
        const y2 = line.y2 * vt[3] + vt[5]

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      ctx.restore()
    })

    // Automatically track history on standard actions and apply page clipping
    const handleObjectAdded = (e: any) => {
      const obj = e.target
      if (obj && !obj.clipPath) {
        obj.clipPath = new Rect({
          left: 0,
          top: 0,
          width: contentWRef.current,
          height: contentHRef.current,
          absolutePositioned: true,
        })
      }
      saveHistory()
    }
    const handleObjectRemoved = () => saveHistory()
    const handleObjectModified = () => saveHistory()

    canvas.on('object:added', handleObjectAdded)
    canvas.on('object:removed', handleObjectRemoved)
    canvas.on('object:modified', handleObjectModified)

    return () => {
      canvas.off('selection:created', syncSelection)
      canvas.off('selection:updated', syncSelection)
      canvas.off('selection:cleared', syncSelection)
      canvas.off('object:modified', syncSelection)
      canvas.off('object:added', handleObjectAdded)
      canvas.off('object:removed', handleObjectRemoved)
      canvas.off('object:modified', handleObjectModified)
      
      canvas.off('object:moving')
      canvas.off('object:modified', clearGuidelines)
      canvas.off('selection:cleared', clearGuidelines)
      canvas.off('mouse:up', clearGuidelines)
      canvas.off('after:render')

      canvas.dispose()
      fabricRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.backgroundImage, saveHistory])

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function getObjectInfo(obj: FabricObject): ActiveObjectInfo {
    if (obj instanceof Textbox) {
      return {
        type: 'textbox',
        fill: (obj.fill as string) ?? '#000000',
        fontSize: obj.fontSize,
        fontWeight: obj.fontWeight as string,
        fontStyle: obj.fontStyle as string,
        textAlign: obj.textAlign,
        color: (obj.fill as string) ?? '#000000',
      }
    }
    if (obj instanceof FabricImage) {
      const activeFilters = obj.filters || []

      const hasFilter = (typeStr: string) => {
        return activeFilters.some(
          (f) => f && (f.type === typeStr || f.constructor.name === typeStr)
        )
      }

      const getFilterValue = (typeStr: string, propName: string) => {
        const found = activeFilters.find(
          (f) => f && (f.type === typeStr || f.constructor.name === typeStr)
        ) as any
        return found ? (found[propName] ?? 0) : 0
      }

      return {
        type: 'image',
        fill: 'transparent',
        filters: {
          grayscale: hasFilter('Grayscale'),
          sepia: hasFilter('Sepia'),
          invert: hasFilter('Invert'),
          blur: getFilterValue('Blur', 'blur'),
          brightness: getFilterValue('Brightness', 'brightness'),
          contrast: getFilterValue('Contrast', 'contrast'),
        },
      }
    }
    if (obj instanceof Group) {
      if ((obj as any).name === 'arrow') {
        const head = obj.getObjects().find((o) => o instanceof Triangle || o.type === 'triangle')
        const fill = head ? (head.fill as string) : '#ffb703'
        return { type: 'shape', fill }
      }
      return { type: 'group', fill: '#ffb703' }
    }
    if (obj instanceof Line) {
      return {
        type: 'shape',
        fill: (obj.stroke as string) ?? '#ffb703',
      }
    }
    return {
      type: 'shape',
      fill: (obj.fill as string) ?? '#ffb703',
    }
  }

  function getCanvas(): Canvas | null {
    return fabricRef.current
  }

  // ─── Public API ─────────────────────────────────────────────────────────────
  // All coordinates use CONTENT space (e.g., 0..1080), not display pixels.

  const addText = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const w = contentWRef.current
    const h = contentHRef.current

    const text = new Textbox('Escribí algo', {
      left: w / 2 - 100,
      top: h / 2 - 20,
      width: 200,
      fontFamily: 'Poppins, sans-serif',
      fontSize: 32,
      fill: '#000000',
      textAlign: 'center',
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }, [])

  const addShape = useCallback((type: ShapeType) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const w = contentWRef.current
    const h = contentHRef.current

    let obj: FabricObject

    switch (type) {
      case 'rect':
        obj = new Rect({
          left: w / 2 - 50,
          top: h / 2 - 50,
          width: 100,
          height: 100,
          fill: '#ffb703',
          rx: 4,
          ry: 4,
        })
        break
      case 'circle':
        obj = new Circle({
          left: w / 2 - 50,
          top: h / 2 - 50,
          radius: 50,
          fill: '#ffb703',
        })
        break
      case 'line':
        obj = new Line([w / 2 - 75, h / 2, w / 2 + 75, h / 2], {
          stroke: '#ffb703',
          strokeWidth: 4,
          strokeLineCap: 'round',
        })
        break
      case 'arrow': {
        const cx = w / 2
        const cy = h / 2
        const shaft = new Line([cx - 60, cy, cx + 40, cy], {
          stroke: '#ffb703',
          strokeWidth: 4,
          strokeLineCap: 'round',
        })
        const head = new Triangle({
          left: cx + 40,
          top: cy - 10,
          width: 20,
          height: 20,
          fill: '#ffb703',
          angle: 90,
        })
        const arrowGroup = new Group([shaft, head], {
          left: cx - 60,
          top: cy - 10,
        })
        ;(arrowGroup as any).name = 'arrow'
        obj = arrowGroup
        break
      }
    }

    canvas.add(obj)
    canvas.setActiveObject(obj)
    canvas.renderAll()
  }, [])

  const addSticker = useCallback(async (imageUrl: string) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const w = contentWRef.current
    const h = contentHRef.current

    try {
      const isSVG = imageUrl.endsWith('.svg')

      if (isSVG) {
        const response = await fetch(imageUrl)
        const svgText = await response.text()
        const result = await loadSVGFromString(svgText)
        const validObjects = (result.objects ?? []).filter(
          (o): o is FabricObject => o !== null
        )
        if (validObjects.length === 0) return

        const group = util.groupSVGElements(validObjects, result.options)

        const maxSize = 150
        const objW = group.width ?? 100
        const objH = group.height ?? 100
        const scale = Math.min(maxSize / objW, maxSize / objH, 1)
        group.set({
          left: w / 2 - (objW * scale) / 2,
          top: h / 2 - (objH * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        })

        canvas.add(group)
        canvas.setActiveObject(group)
        canvas.renderAll()
      } else {
        const img = await FabricImage.fromURL(imageUrl)

        const maxSize = 150
        const scale = Math.min(
          maxSize / (img.width ?? 150),
          maxSize / (img.height ?? 150),
          1
        )
        img.set({
          left: w / 2 - ((img.width ?? 150) * scale) / 2,
          top: h / 2 - ((img.height ?? 150) * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        })

        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
      }
    } catch (err) {
      console.error('Error adding sticker:', err)
    }
  }, [])

  const addUploadedImage = useCallback(async (file: File) => {
    const canvas = fabricRef.current
    if (!canvas) return
    const w = contentWRef.current
    const h = contentHRef.current

    const url = URL.createObjectURL(file)
    try {
      const img = await FabricImage.fromURL(url)

      const maxW = w * 0.8
      const maxH = h * 0.8
      const scale = Math.min(maxW / (img.width ?? 400), maxH / (img.height ?? 400), 1)
      img.set({
        left: w / 2 - ((img.width ?? 400) * scale) / 2,
        top: h / 2 - ((img.height ?? 400) * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      })

      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    } catch (err) {
      console.error('Error adding uploaded image:', err)
    }
  }, [])

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const active = canvas.getActiveObject()
    if (active) {
      if (active.type === 'activeSelection') {
        const activeSel = active as any
        if ('forEachObject' in activeSel) {
          activeSel.forEachObject((obj: FabricObject) => {
            canvas.remove(obj)
          })
        } else if (activeSel._objects) {
          activeSel._objects.forEach((obj: FabricObject) => {
            canvas.remove(obj)
          })
        }
      } else {
        canvas.remove(active)
      }
      canvas.discardActiveObject()
      canvas.renderAll()
      setActiveObjectInfo(null)
    }
  }, [])

  const duplicateSelected = useCallback(async () => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active) return

    if (active instanceof Textbox && active.isEditing) {
      return
    }

    try {
      const cloned = await active.clone()
      canvas.discardActiveObject()
      
      cloned.set({
        left: (active.left ?? 0) + 20,
        top: (active.top ?? 0) + 20,
        evented: true,
      })

      if (cloned.type === 'activeSelection' || (cloned as any)._objects) {
        cloned.canvas = canvas
        if ('forEachObject' in cloned) {
          (cloned as any).forEachObject((obj: FabricObject) => {
            canvas.add(obj)
          })
        } else {
          canvas.add(cloned)
        }
        cloned.setCoords()
      } else {
        canvas.add(cloned)
      }

      // Automatically add individual clip path for newly duplicated objects
      if (cloned && !cloned.clipPath) {
        cloned.clipPath = new Rect({
          left: 0,
          top: 0,
          width: contentWRef.current,
          height: contentHRef.current,
          absolutePositioned: true,
        })
      }

      canvas.setActiveObject(cloned)
      canvas.renderAll()
      saveHistory()
    } catch (err) {
      console.error('Error duplicating object:', err)
    }
  }, [saveHistory])

  const bringToFront = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active) {
      canvas.bringObjectToFront(active)
      canvas.renderAll()
      saveHistory()
    }
  }, [saveHistory])

  const sendToBack = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active) {
      canvas.sendObjectToBack(active)
      canvas.renderAll()
      saveHistory()
    }
  }, [saveHistory])

  const exportToPNG = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const cw = contentWRef.current
    const ch = contentHRef.current

    // Hide selection handles
    canvas.discardActiveObject()
    canvas.renderAll()

    // Save original state
    const savedTransform = canvas.viewportTransform ? (canvas.viewportTransform.slice() as [number, number, number, number, number, number]) : null
    const savedBgColor = canvas.backgroundColor

    // Temporarily set canvas to full content resolution for high-quality export
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    canvas.setDimensions({ width: cw, height: ch })
    canvas.backgroundColor = options.backgroundColor || '#ffffff'
    canvas.renderAll()

    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
    })

    // Restore display dimensions and zoom/padding transform
    canvas.backgroundColor = savedBgColor
    canvas.setDimensions({
      width: containerWRef.current,
      height: containerHRef.current,
    })
    if (savedTransform) {
      canvas.setViewportTransform(savedTransform)
    }
    canvas.renderAll()

    // Trigger browser download
    const link = document.createElement('a')
    link.download = `publi-editor-${Date.now()}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setActiveObjectInfo(null)
  }, [options.backgroundColor])

  // ─── Update active object properties ────────────────────────────────────────

  // ─── Smart Resizer ──────────────────────────────────────────────────────────
  const changeDimensions = useCallback((newW: number, newH: number) => {
    const canvas = fabricRef.current
    if (!canvas) return

    const parent = canvas.getElement().parentElement?.parentElement?.parentElement
    if (!parent) return
    const displayW = parent.clientWidth || 800
    const displayH = parent.clientHeight || 640

    const scale = Math.min((displayW * 0.8) / newW, (displayH * 0.8) / newH, 1)
    const finalW = Math.round(newW * scale)
    const finalH = Math.round(newH * scale)

    const currentW = contentWRef.current
    const currentH = contentHRef.current
    const scaleXFactor = newW / currentW
    const scaleYFactor = newH / currentH
    const uniformScale = Math.min(scaleXFactor, scaleYFactor)

    canvas.getObjects().forEach((obj) => {
      if (obj.selectable === false && obj.evented === false) {
        // Background image
        const scaleImg = Math.min(newW / (obj.width ?? newW), newH / (obj.height ?? newH))
        obj.set({
          left: (newW - (obj.width ?? newW) * scaleImg) / 2,
          top: (newH - (obj.height ?? newH) * scaleImg) / 2,
          scaleX: scaleImg,
          scaleY: scaleImg,
        })
      } else {
        // Normal objects
        obj.set({
          left: (obj.left ?? 0) * scaleXFactor,
          top: (obj.top ?? 0) * scaleYFactor,
          scaleX: (obj.scaleX ?? 1) * uniformScale,
          scaleY: (obj.scaleY ?? 1) * uniformScale,
        })
      }

      // Update individual clipPath size to match new dimensions
      if (obj.clipPath && obj.clipPath instanceof Rect) {
        obj.clipPath.set({
          width: newW,
          height: newH,
        })
      } else {
        obj.clipPath = new Rect({
          left: 0,
          top: 0,
          width: newW,
          height: newH,
          absolutePositioned: true,
        })
      }

      obj.setCoords()
    })

    const offsetX = (displayW - finalW) / 2
    const offsetY = (displayH - finalH) / 2

    canvas.setDimensions({ width: displayW, height: displayH })
    canvas.setViewportTransform([scale, 0, 0, scale, offsetX, offsetY])
    canvas.renderAll()

    setContentW(newW)
    setContentH(newH)
    setDisplayWidth(finalW)
    setDisplayHeight(finalH)
    setDisplayScale(scale)

    contentWRef.current = newW
    contentHRef.current = newH
    displayScaleRef.current = scale
    displayWRef.current = finalW
    displayHRef.current = finalH

    saveHistory()
  }, [saveHistory])

  // ─── Image Filters ──────────────────────────────────────────────────────────
  const applyImageFilter = useCallback(
    (filterType: 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast', value: number | boolean) => {
      const canvas = fabricRef.current
      if (!canvas) return

      const active = canvas.getActiveObject()
      if (!active) return

      let targetImg: FabricImage | null = null
      if (active instanceof FabricImage) {
        targetImg = active
      }

      if (!targetImg) return

      if (!targetImg.filters) {
        targetImg.filters = []
      }

      const filterClassMap: Record<string, any> = {
        grayscale: filters.Grayscale,
        sepia: filters.Sepia,
        invert: filters.Invert,
        blur: filters.Blur,
        brightness: filters.Brightness,
        contrast: filters.Contrast,
      }

      const FilterClass = filterClassMap[filterType]
      if (!FilterClass) return

      // Remove existing filter of same type
      targetImg.filters = targetImg.filters.filter((f) => !(f instanceof FilterClass))

      if (typeof value === 'boolean') {
        if (value === true) {
          targetImg.filters.push(new FilterClass())
        }
      } else if (typeof value === 'number') {
        if (filterType === 'brightness') {
          targetImg.filters.push(new filters.Brightness({ brightness: value }))
        } else if (filterType === 'contrast') {
          targetImg.filters.push(new filters.Contrast({ contrast: value }))
        } else if (filterType === 'blur') {
          targetImg.filters.push(new filters.Blur({ blur: value }))
        }
      }

      targetImg.applyFilters()
      canvas.renderAll()

      setActiveObjectInfo(getObjectInfo(targetImg))
      saveHistory()
    },
    [saveHistory]
  )

  const updateActiveObjectProp = useCallback(
    (prop: string, value: unknown) => {
      const canvas = fabricRef.current
      if (!canvas) return

      const active = canvas.getActiveObject()
      if (!active) return

      if (prop === 'fill') {
        const color = value as string
        if (active instanceof Line) {
          active.set({ fill: color, stroke: color })
        } else if (active instanceof Group && (active as any).name === 'arrow') {
          active.getObjects().forEach((child) => {
            if (child instanceof Line) {
              child.set({ stroke: color })
            } else {
              child.set({ fill: color })
            }
          })
          active.set({ fill: color })
        } else {
          active.set({ fill: color } as any)
        }
      } else {
        active.set(prop as keyof FabricObject, value as never)
      }

      canvas.renderAll()
      setActiveObjectInfo(getObjectInfo(active))
      saveHistory()
    },
    [saveHistory]
  )

  // ─── Keyboard Event Listener ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const canvas = fabricRef.current
      if (!canvas) return

      // Skip shortcuts if focusing input/textarea/editable element
      const activeElement = document.activeElement
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.hasAttribute('contenteditable'))
      ) {
        return
      }

      // Skip shortcuts if a Textbox is actively being edited
      const activeObject = canvas.getActiveObject()
      if (activeObject && activeObject instanceof Textbox && activeObject.isEditing) {
        return
      }

      const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      // Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
      }

      // Copy (Ctrl+C / Cmd+C)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        copy()
      }

      // Paste (Ctrl+V / Cmd+V)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        paste()
      }

      // Undo (Ctrl+Z / Cmd+Z)
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }

      // Redo (Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z)
      if (
        (isCmdOrCtrl && e.key.toLowerCase() === 'y') ||
        (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        redo()
      }

      // Arrow Key Nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!activeObject) return
        e.preventDefault()

        const nudgeAmount = e.shiftKey ? 10 : 1
        const left = activeObject.left ?? 0
        const top = activeObject.top ?? 0

        switch (e.key) {
          case 'ArrowUp':
            activeObject.set({ top: top - nudgeAmount })
            break
          case 'ArrowDown':
            activeObject.set({ top: top + nudgeAmount })
            break
          case 'ArrowLeft':
            activeObject.set({ left: left - nudgeAmount })
            break
          case 'ArrowRight':
            activeObject.set({ left: left + nudgeAmount })
            break
        }

        activeObject.setCoords()
        canvas.renderAll()
        saveHistory()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deleteSelected, copy, paste, undo, redo, saveHistory])



  return {
    getCanvas,
    displayWidth,
    displayHeight,
    contentWidth: contentW,
    contentHeight: contentH,
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
    // Expose history actions and state
    canUndo,
    canRedo,
    undo,
    redo,
  }
}

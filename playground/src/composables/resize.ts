import type { MaybeElementRef, MaybeRef } from '@vueuse/core'
import { clamp, createEventHook, tryOnScopeDispose, unrefElement, useEventListener } from '@vueuse/core'
import { computed, nextTick, reactive, ref, unref, watch } from 'vue'

type Edges = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom'

export interface UseResizeOptions {
  disabled?: boolean
  mode?: MaybeRef<'auto' | 'manual'>
  disableCursor?: MaybeRef<boolean>
  xMultiplier?: MaybeRef<number>
  yMultiplier?: MaybeRef<number>
  borderRadius?: MaybeRef<number>
  minWidth?: MaybeRef<number> | 'initial'
  maxWidth?: MaybeRef<number> | 'initial'
  minHeight?: MaybeRef<number> | 'initial'
  maxHeight?: MaybeRef<number> | 'initial'
  edges?: MaybeRef<Edges[]>
  edgeWidth?: MaybeRef<number[]>
}

const container = ref<MaybeElementRef[]>([])

export function useResize(element: MaybeElementRef, options: UseResizeOptions = {}) {
  const {
    disabled = false,
    mode = 'auto',
    disableCursor = false,
    xMultiplier = 1,
    yMultiplier = 1,
    borderRadius = 0,
    edges = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right', 'top', 'bottom'],
    edgeWidth = [16, 8],
  } = options
  let {
    minWidth = 1,
    maxWidth = Number.POSITIVE_INFINITY,
    minHeight = 1,
    maxHeight = Number.POSITIVE_INFINITY,
  } = options

  const isActive = ref(disabled)
  const target = computed(() => unrefElement(element))

  let width = 0
  let height = 0

  const onResizeStart = createEventHook<{ pointer: PointerEvent }>()
  const onResizeEnd = createEventHook<{ pointer: PointerEvent }>()
  const onResizeMove = createEventHook<{
    pointer: PointerEvent
    xDiff: number
    yDiff: number
    startX: number
    startY: number
    newWidth: number
    newHeight: number
    minHeight: number
    minWidth: number
    maxHeight: number
    maxWidth: number
  }>()

  const isOutside = ref(false)
  const isOverEdge = ref(false)
  const isResizing = ref(false)
  const isPathIncludesTarget = ref(false)
  const direction = ref('')
  const leftStart = ref(0)
  const topStart = ref(0)
  const leftStartMax = ref(0)
  const topStartMax = ref(0)
  const leftStartMin = ref(0)
  const topStartMin = ref(0)

  const pointer = reactive({ startX: 0, startY: 0, currentX: 0, currentY: 0 })

  const widthRef = ref(0)
  const heightRef = ref(0)
  const transform = ref('')
  const style = computed(() => [
    unref(widthRef) && `width: ${unref(widthRef)}px;`,
    unref(heightRef) && `height: ${unref(heightRef)}px;`,
    unref(transform) && `transform: ${unref(transform)};`,
  ].filter(Boolean).join(''))

  watch(style, () => {
    if (target.value && unref(mode) === 'auto')
      target.value.setAttribute('style', style.value)
  })

  useEventListener(window, 'pointerdown', onPointerDown)
  useEventListener(window, 'pointerup', onPointerUp)
  useEventListener(window, 'pointercancel', onPointerUp)
  useEventListener(window, 'lostpointercapture', onPointerUp)
  useEventListener(window, 'pointermove', onPointerMove)
  watch(pointer, handlePointer)

  const start = () => {
    isActive.value = true
  }

  const stop = () => {
    container.value = []
    isActive.value = false
    isResizing.value = false
    window!.document.body.style.setProperty('cursor', '')
  }

  watch(target, (value) => {
    if (value) {
      start()
      ;({ width, height } = value.getBoundingClientRect())
      if (minWidth === 'initial')
        minWidth = width
      if (minHeight === 'initial')
        minHeight = height
      if (maxWidth === 'initial')
        maxWidth = width
      if (maxHeight === 'initial')
        maxHeight = height

      // dont set widthheight if element is not visible
      // set width height when element comes visible
      if (!width)
        return

      widthRef.value = clamp(width, unref(minWidth), unref(maxWidth))
      heightRef.value = clamp(height, unref(minHeight), unref(maxHeight))
    }
    else {
      stop()
    }
  })

  const setCursorAndDirection = (setCursor = '', setDirection = '', setTouchAction = 'none') => {
    if (setDirection && !container.value.includes(target.value)) {
      container.value.push(target.value)
    }
    if (container.value[0] === target.value) {
      direction.value = setDirection
      isOverEdge.value = !!setDirection
      if (!unref(disableCursor))
        window!.document.body.style.setProperty('cursor', setCursor)
      window!.document.body.style.setProperty('touch-action', setTouchAction)
      window!.document.body.style.setProperty('user-select', setTouchAction)
    }
    if (!setDirection && container.value.includes(target.value)) {
      container.value.splice(container.value.indexOf(target.value), 1)
    }
  }

  async function onPointerUp(evt: PointerEvent) {
    if (!target.value)
      return

    isOutside.value = false

    if (!isOverEdge.value)
      return

    isResizing.value = false

    if (evt.pointerType === 'touch')
      setCursorAndDirection('', '', '')

    onResizeEnd.trigger({ pointer: evt })
    evt.preventDefault()
  }

  let scale = 1
  let xMultiplierStatic = 1
  let yMultiplierStatic = 1
  function onPointerMove(evt: PointerEvent) {
    if (!target.value)
      return

    isPathIncludesTarget.value = (evt.composedPath() as Element[]).includes(target.value)

    pointer.currentX = evt.x
    pointer.currentY = evt.y

    if (evt.pressure === 0 && !evt.movementX && !evt.movementY)
      handlePointer(pointer)

    if (!isOverEdge.value || !isResizing.value)
      return

    let newWidth = width / scale
    let newHeight = height / scale

    const xDiff = Math.abs(evt.x - pointer.startX) * xMultiplierStatic
    const yDiff = Math.abs(evt.y - pointer.startY) * yMultiplierStatic

    if (direction.value.includes('bottom'))
      newHeight += (evt.y > pointer.startY ? Math.abs(yDiff) : -Math.abs(yDiff))

    if (direction.value.includes('top'))
      newHeight += (evt.y > pointer.startY ? -Math.abs(yDiff) : Math.abs(yDiff))

    if (direction.value.includes('left'))
      newWidth += (evt.x > pointer.startX ? -Math.abs(xDiff) : Math.abs(xDiff))

    if (direction.value.includes('right'))
      newWidth += (evt.x > pointer.startX ? Math.abs(xDiff) : -Math.abs(xDiff))

    const { left, top } = target.value.getBoundingClientRect()

    widthRef.value = clamp(newWidth, Number(unref(minWidth)), Number(unref(maxWidth)))
    heightRef.value = clamp(newHeight, Number(unref(minHeight)), Number(unref(maxHeight)))

    transform.value = getComputedStyle(target.value).position === 'fixed'
      ? `translate(${direction.value.includes('left')
        ? clamp(leftStart.value + xDiff, leftStartMin.value, leftStartMax.value)
        : left}px,${direction.value.includes('top')
        ? clamp(topStart.value + yDiff, topStartMin.value, topStartMax.value)
        : top}px);`
      : ''

    onResizeMove.trigger({
      pointer: evt,
      xDiff,
      yDiff,
      startX: pointer.startX,
      startY: pointer.startY,
      newWidth: widthRef.value,
      newHeight: heightRef.value,
      minHeight: Number(minHeight),
      minWidth: Number(minWidth),
      maxHeight: Number(maxHeight),
      maxWidth: Number(maxWidth),
    })
    evt.preventDefault()
  }

  async function onPointerDown(evt: PointerEvent) {
    if (!target.value)
      return

    xMultiplierStatic = unref(xMultiplier)
    yMultiplierStatic = unref(yMultiplier)

    if (evt.pointerType === 'touch') {
      pointer.currentX = evt.x
      pointer.currentY = evt.y
      isPathIncludesTarget.value = (evt.composedPath() as Element[]).includes(target.value)
      await nextTick()
    }
    if (isOverEdge.value || (isOverEdge.value && evt.pointerType === 'touch')) {
      scale = Number(target.value.style.getPropertyValue('transform').match(/scale\((.+?)\)/)?.[1] || 1)
      const clientRect = target.value.getBoundingClientRect()
      width = clientRect.width
      height = clientRect.height
      leftStart.value = clientRect.left
      topStart.value = clientRect.top
      leftStartMax.value = (clientRect.width - Number(unref(minWidth))) + clientRect.left
      topStartMax.value = (clientRect.height - Number(unref(minHeight))) + clientRect.top
      leftStartMin.value = clientRect.left - (Number(unref(maxWidth)) - clientRect.width)
      topStartMin.value = clientRect.top - (Number(unref(maxHeight)) - clientRect.height)
      isResizing.value = true
      pointer.startY = evt.y
      pointer.startX = evt.x
      onResizeStart.trigger({ pointer: evt })
      evt.preventDefault()
    }
    else {
      isOutside.value = true
    }
  }

  const isOnForeground = (x: number, y: number, corner = false, xReduce?: number, yReduce?: number) => {
    const getCorner = (xA: number, yA: number) => {
      let found = false
      while (!found && Math.abs(xA - x) < unref(borderRadius) / 2) {
        xA += xReduce!
        yA += yReduce!
        found = target.value!.contains(window!.document.elementFromPoint(xA, yA)) || window!.document.elementFromPoint(xA, yA) === target.value!
      }
      return found
    }
    const element = window!.document.elementFromPoint(x, y)
    return isPathIncludesTarget.value || (element && target.value!.contains(element)) || (corner && getCorner(x, y))
  }

  const isEdgeActive = (edge: Edges) => {
    return unref(edges).includes(edge)
  }

  function handlePointer({ currentX, currentY }: typeof pointer) {
    if (isResizing.value || isOutside.value)
      return

    const clientRect = target.value!.getBoundingClientRect()
    const { left, top } = clientRect
    let { right, bottom } = clientRect

    right -= 1
    bottom -= 1

    let [edgeWidthInside, edgeWidthOutside] = unref(edgeWidth)

    edgeWidthInside -= 1
    edgeWidthOutside += 1

    if (
      (((currentY - top) < 0 ? Math.abs(currentY - top) < edgeWidthOutside : (currentY - top) <= edgeWidthInside)
        && ((currentX - left) < 0 ? Math.abs(currentX - left) < edgeWidthOutside : (currentX - left) <= edgeWidthInside))
        && isEdgeActive('top-left')
        && isOnForeground(left, top, true, 1, 1)
    ) {
      setCursorAndDirection('nwse-resize', 'top-left')
    }

    else if (
      (((currentY - top) < 0 ? Math.abs(currentY - top) < edgeWidthOutside : (currentY - top) < edgeWidthInside)
        && ((currentX - right) > 0 ? Math.abs(currentX - right) < edgeWidthOutside : Math.abs(currentX - right) < edgeWidthInside))
        && isEdgeActive('top-right')
        && isOnForeground(right, top, true, -1, 1)
    ) {
      setCursorAndDirection('nesw-resize', 'top-right')
    }

    else if (
      (((currentY - bottom) > 0 ? Math.abs(currentY - bottom) < edgeWidthOutside : Math.abs(currentY - bottom) < edgeWidthInside)
        && ((currentX - left) < 0 ? Math.abs(currentX - left) < edgeWidthOutside : (currentX - left) < edgeWidthInside))
        && isEdgeActive('bottom-left')
        && isOnForeground(left, bottom, true, 1, -1)
    ) {
      setCursorAndDirection('nesw-resize', 'bottom-left')
    }

    else if (
      (((currentY - bottom) > 0 ? Math.abs(currentY - bottom) < edgeWidthOutside : Math.abs(currentY - bottom) < edgeWidthInside)
        && ((currentX - right) > 0 ? Math.abs(currentX - right) < edgeWidthOutside : Math.abs(currentX - right) < edgeWidthInside))
        && isEdgeActive('bottom-right')
        && isOnForeground(right, bottom, true, -1, -1)
    ) {
      setCursorAndDirection('nwse-resize', 'bottom-right')
    }

    else if (
      (((currentY - bottom) > 0 && Math.abs(currentY - bottom) < edgeWidthOutside)
        || ((currentY - bottom) <= 0 && Math.abs(currentY - bottom) <= edgeWidthInside))
        && currentX > left
        && currentX < right
        && isEdgeActive('bottom')
        && isOnForeground(currentX, bottom)
    ) {
      setCursorAndDirection('ns-resize', 'bottom')
    }

    else if (
      (((currentY - top) < 0 && Math.abs(currentY - top) < edgeWidthOutside)
        || ((currentY - top) >= 0 && Math.abs(currentY - top) <= edgeWidthInside))
        && currentX > left
        && currentX < right
        && isEdgeActive('top')
        && isOnForeground(currentX, top)
    ) {
      setCursorAndDirection('ns-resize', 'top')
    }

    else if (
      (((currentX - left) < 0 && Math.abs(currentX - left) < edgeWidthOutside)
        || ((currentX - left) >= 0 && Math.abs(currentX - left) <= edgeWidthInside))
        && currentY > top
        && currentY < bottom
        && isEdgeActive('left')
        && isOnForeground(left, currentY)
    ) {
      setCursorAndDirection('ew-resize', 'left')
    }

    else if (
      (((currentX - right) > 0 && Math.abs(currentX - right) < edgeWidthOutside)
        || ((currentX - right) <= 0 && Math.abs(currentX - right) <= edgeWidthInside))
        && currentY > top
        && currentY < bottom
        && isEdgeActive('right')
        && isOnForeground(right, currentY)
    ) {
      setCursorAndDirection('ew-resize', 'right')
    }

    else {
      setCursorAndDirection('', '', '')
    }
  }

  tryOnScopeDispose(stop)

  return {
    width: widthRef,
    height: heightRef,
    stop,
    start,
    direction,
    isActive,
    isOverEdge,
    isResizing,
    onResizeStart: onResizeStart.on,
    onResizeMove: onResizeMove.on,
    onResizeEnd: onResizeEnd.on,
    style,
  }
}

<template>
  <div ref="containerRef">
    <slot />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  animation: {
    type: Number,
    default: 150
  },
  /** true = 交换模式（两元素互换位置），false = 排序模式（拖拽插入） */
  swap: {
    type: Boolean,
    default: false
  },
  ghostClass: {
    type: String,
    default: ''
  },
  swapClass: {
    type: String,
    default: ''
  },
  /** 拖拽校验：(evt) => boolean，evt 含 draggedContext / relatedContext */
  move: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'end'])
const containerRef = ref(null)

// ── 共享状态 ──
let dragFromIndex = -1
let currentSwapTarget = null

// ── Touch 状态 ──
let touchClone = null
let touchIdentifier = null
let touchStartX = 0
let touchStartY = 0
let touchDragStarted = false
let touchOffsetX = 0
let touchOffsetY = 0
const DRAG_THRESHOLD = 8

// ── 工具函数 ──

/** 找到 el 对应的容器直接子元素 */
function getDirectChild(el) {
  const container = containerRef.value
  if (!container || !el) return null
  let node = el
  while (node && node.parentElement !== container) {
    node = node.parentElement
    if (!node) return null
  }
  return node?.parentElement === container ? node : null
}

function getChildIndex(child) {
  if (!containerRef.value || !child) return -1
  return Array.from(containerRef.value.children).indexOf(child)
}

function canMove(fromIdx, toIdx) {
  if (fromIdx < 0 || toIdx < 0) return false
  if (fromIdx >= props.modelValue.length || toIdx >= props.modelValue.length)
    return false
  if (!props.move) return true
  return !!props.move({
    draggedContext: { element: props.modelValue[fromIdx], index: fromIdx },
    relatedContext: { element: props.modelValue[toIdx], index: toIdx }
  })
}

function setDraggable() {
  const container = containerRef.value
  if (!container) return
  Array.from(container.children).forEach(child => {
    if (props.disabled) {
      child.removeAttribute('draggable')
    } else {
      child.setAttribute('draggable', 'true')
    }
  })
}

function clearAllClasses() {
  const container = containerRef.value
  if (!container) return
  if (props.ghostClass) {
    container
      .querySelectorAll(`.${props.ghostClass}`)
      .forEach(el => el.classList.remove(props.ghostClass))
  }
  if (props.swapClass) {
    container
      .querySelectorAll(`.${props.swapClass}`)
      .forEach(el => el.classList.remove(props.swapClass))
  }
}

// ── FLIP 动画 ──

function animateFLIP(oldRects) {
  if (props.animation <= 0) return
  const container = containerRef.value
  if (!container) return

  nextTick(() => {
    const movedChildren = []
    Array.from(container.children).forEach(child => {
      const oldRect = oldRects.get(child)
      if (!oldRect) return
      const newRect = child.getBoundingClientRect()
      const dx = oldRect.left - newRect.left
      const dy = oldRect.top - newRect.top
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return

      child.style.transform = `translate(${dx}px, ${dy}px)`
      child.style.transition = 'none'
      movedChildren.push(child)
    })

    // 强制重排后启动过渡
    // eslint-disable-next-line no-unused-expressions
    document.body.offsetHeight

    movedChildren.forEach(child => {
      child.style.transition = `transform ${props.animation}ms ease`
      child.style.transform = ''
      child.addEventListener(
        'transitionend',
        () => {
          child.style.transition = ''
        },
        { once: true }
      )
    })
  })
}

// ── 交换 / 排序 ──

function commitDrag(fromIdx, toIdx) {
  if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return
  if (!canMove(fromIdx, toIdx)) return

  // 记录旧位置
  const container = containerRef.value
  const oldRects = new Map()
  if (props.animation > 0 && container) {
    Array.from(container.children).forEach(child => {
      oldRects.set(child, child.getBoundingClientRect())
    })
  }

  const newList = [...props.modelValue]
  if (props.swap) {
    ;[newList[fromIdx], newList[toIdx]] = [newList[toIdx], newList[fromIdx]]
  } else {
    const [item] = newList.splice(fromIdx, 1)
    newList.splice(toIdx, 0, item)
  }

  emit('update:modelValue', newList)
  emit('end', { oldIndex: fromIdx, newIndex: toIdx })

  if (props.animation > 0) {
    animateFLIP(oldRects)
  }
}

// ── HTML5 Drag & Drop（事件委托） ──

function onDragStart(e) {
  if (props.disabled) return
  const child = getDirectChild(e.target)
  if (!child) return
  dragFromIndex = getChildIndex(child)
  if (dragFromIndex < 0) return

  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', '')

  // 延迟一帧再加 ghostClass，确保浏览器先截取拖拽快照
  requestAnimationFrame(() => {
    if (props.ghostClass && child) child.classList.add(props.ghostClass)
  })
}

function onDragOver(e) {
  if (props.disabled || dragFromIndex < 0) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'

  const child = getDirectChild(e.target)

  if (!child || getChildIndex(child) === dragFromIndex) {
    if (currentSwapTarget && props.swapClass) {
      currentSwapTarget.classList.remove(props.swapClass)
      currentSwapTarget = null
    }
    return
  }

  const toIdx = getChildIndex(child)
  if (toIdx < 0) return

  if (currentSwapTarget !== child) {
    if (currentSwapTarget && props.swapClass) {
      currentSwapTarget.classList.remove(props.swapClass)
    }
    if (canMove(dragFromIndex, toIdx) && props.swapClass) {
      child.classList.add(props.swapClass)
    }
    currentSwapTarget = child
  }
}

function onDrop(e) {
  if (props.disabled || dragFromIndex < 0) return
  e.preventDefault()

  const child = getDirectChild(e.target)
  const fromIdx = dragFromIndex
  const toIdx = child ? getChildIndex(child) : -1

  clearAllClasses()
  resetDragState()

  if (toIdx >= 0) {
    commitDrag(fromIdx, toIdx)
  }
}

function onDragEnd() {
  clearAllClasses()
  resetDragState()
}

function resetDragState() {
  dragFromIndex = -1
  currentSwapTarget = null
}

// ── Touch 拖拽 ──

function onTouchStart(e) {
  if (props.disabled || e.touches.length !== 1) return

  const touch = e.touches[0]
  const child = getDirectChild(touch.target)
  if (!child) return
  const idx = getChildIndex(child)
  if (idx < 0) return

  dragFromIndex = idx
  touchIdentifier = touch.identifier
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchDragStarted = false

  const rect = child.getBoundingClientRect()
  touchOffsetX = touch.clientX - rect.left
  touchOffsetY = touch.clientY - rect.top
}

function onTouchMove(e) {
  if (props.disabled || dragFromIndex < 0 || touchIdentifier === null) return

  const touch = Array.from(e.touches).find(
    t => t.identifier === touchIdentifier
  )
  if (!touch) return

  if (!touchDragStarted) {
    const dx = Math.abs(touch.clientX - touchStartX)
    const dy = Math.abs(touch.clientY - touchStartY)
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return

    touchDragStarted = true
    const child = containerRef.value?.children[dragFromIndex]
    if (!child) {
      cleanupTouch()
      return
    }

    if (props.ghostClass) child.classList.add(props.ghostClass)

    // 创建浮动副本
    const rect = child.getBoundingClientRect()
    touchClone = child.cloneNode(true)
    Object.assign(touchClone.style, {
      position: 'fixed',
      left: `${touch.clientX - touchOffsetX}px`,
      top: `${touch.clientY - touchOffsetY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: '10000',
      opacity: '0.8',
      pointerEvents: 'none',
      margin: '0',
      boxSizing: 'border-box',
      transition: 'none'
    })
    document.body.appendChild(touchClone)
  }

  e.preventDefault()

  // 移动副本
  if (touchClone) {
    touchClone.style.left = `${touch.clientX - touchOffsetX}px`
    touchClone.style.top = `${touch.clientY - touchOffsetY}px`
  }

  // 隐藏副本后用 elementFromPoint 找目标
  if (touchClone) touchClone.hidden = true
  const targetEl = document.elementFromPoint(touch.clientX, touch.clientY)
  if (touchClone) touchClone.hidden = false

  const targetChild = targetEl ? getDirectChild(targetEl) : null

  if (currentSwapTarget && currentSwapTarget !== targetChild) {
    if (props.swapClass) currentSwapTarget.classList.remove(props.swapClass)
    currentSwapTarget = null
  }

  if (targetChild) {
    const toIdx = getChildIndex(targetChild)
    if (
      toIdx >= 0 &&
      toIdx !== dragFromIndex &&
      canMove(dragFromIndex, toIdx)
    ) {
      if (props.swapClass) targetChild.classList.add(props.swapClass)
      currentSwapTarget = targetChild
    }
  }
}

function onTouchEnd() {
  if (props.disabled || dragFromIndex < 0) {
    cleanupTouch()
    return
  }

  if (!touchDragStarted) {
    cleanupTouch()
    return
  }

  const toIdx = currentSwapTarget ? getChildIndex(currentSwapTarget) : -1
  const fromIdx = dragFromIndex

  cleanupTouch()

  if (toIdx >= 0 && toIdx !== fromIdx) {
    commitDrag(fromIdx, toIdx)
  }
}

function cleanupTouch() {
  if (touchClone) {
    touchClone.remove()
    touchClone = null
  }
  clearAllClasses()
  touchDragStarted = false
  touchIdentifier = null
  dragFromIndex = -1
  currentSwapTarget = null
}

// ── 生命周期 ──

let observer = null

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  setDraggable()

  // HTML5 DnD
  container.addEventListener('dragstart', onDragStart)
  container.addEventListener('dragover', onDragOver)
  container.addEventListener('drop', onDrop)
  container.addEventListener('dragend', onDragEnd)

  // Touch
  container.addEventListener('touchstart', onTouchStart, { passive: true })
  container.addEventListener('touchmove', onTouchMove, { passive: false })
  container.addEventListener('touchend', onTouchEnd)
  container.addEventListener('touchcancel', onTouchEnd)

  // 监听子元素变化，重新设置 draggable 属性
  observer = new MutationObserver(() => setDraggable())
  observer.observe(container, { childList: true })
})

onBeforeUnmount(() => {
  const container = containerRef.value
  if (container) {
    container.removeEventListener('dragstart', onDragStart)
    container.removeEventListener('dragover', onDragOver)
    container.removeEventListener('drop', onDrop)
    container.removeEventListener('dragend', onDragEnd)
    container.removeEventListener('touchstart', onTouchStart)
    container.removeEventListener('touchmove', onTouchMove)
    container.removeEventListener('touchend', onTouchEnd)
    container.removeEventListener('touchcancel', onTouchEnd)
  }
  if (observer) {
    observer.disconnect()
    observer = null
  }
  cleanupTouch()
})

watch(
  () => props.disabled,
  () => {
    setDraggable()
    if (props.disabled) {
      clearAllClasses()
      cleanupTouch()
      resetDragState()
    }
  }
)
</script>

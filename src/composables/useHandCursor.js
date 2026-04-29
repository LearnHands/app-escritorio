import { ref, computed, watch } from 'vue'
import { landmarks, isDetecting } from './useMediaPipe.js'

// Punto 8 = punta del índice
const INDEX_TIP  = 8
// Punto 4 = punta del pulgar
const THUMB_TIP  = 4

// Suavizado: factor lerp (0 = sin suavizar, 1 = sin movimiento)
const LERP_FACTOR = 0.25

// Estado del cursor — global
export const cursorX   = ref(0)
export const cursorY   = ref(0)
export const isVisible = ref(false)

// Estado interno para lerp
let rawX = 0
let rawY = 0
let animFrame = null

function lerp(a, b, t) {
  return a + (b - a) * t
}

function startCursorLoop() {
  function loop() {
    cursorX.value = lerp(cursorX.value, rawX, LERP_FACTOR)
    cursorY.value = lerp(cursorY.value, rawY, LERP_FACTOR)
    animFrame = requestAnimationFrame(loop)
  }
  loop()
}

function stopCursorLoop() {
  if (animFrame) {
    cancelAnimationFrame(animFrame)
    animFrame = null
  }
}

export function useHandCursor() {
  startCursorLoop()

  // Watcher que actualiza raw position cuando llegan nuevos landmarks
  watch(landmarks, (lm) => {
    if (!lm || lm.length === 0) {
      isVisible.value = false
      return
    }

    const indexTip = lm[INDEX_TIP]
    if (!indexTip) return

    // MediaPipe devuelve coords normalizadas [0,1]
    // La imagen viene espejada horizontalmente → invertimos X
    const screenW = window.innerWidth
    const screenH = window.innerHeight

    rawX = (1 - indexTip.x) * screenW
    rawY = indexTip.y * screenH

    isVisible.value = true
  }, { deep: true })

  return {
    cursorX,
    cursorY,
    isVisible,
    stopCursorLoop,
  }
}

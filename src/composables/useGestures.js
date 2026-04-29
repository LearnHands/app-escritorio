import { ref, watch, computed } from 'vue'
import { landmarks, isDetecting } from './useMediaPipe.js'

// Índices MediaPipe
const THUMB_TIP  = 4
const INDEX_TIP  = 8
const MIDDLE_TIP = 12

// Umbrales
const PINCH_THRESHOLD = 0.07   // distancia normalizada para pinza
const OPEN_HAND_THRESHOLD = 0.15 // dedos extendidos para "mano abierta"

// Estado global de gestos
export const isPinching    = ref(false)
export const isOpenHand    = ref(false)
export const isIndexUp     = ref(false) // solo índice extendido (para dibujar)
export const pinchStrength = ref(0)    // 0-1

// Debounce interno
let pinchDebounce = null
let lastPinchState = false

function distance2D(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function isFingerExtended(lm, tipIdx, pipIdx) {
  // Un dedo está extendido si su punta está más arriba que su articulación PIP
  return lm[tipIdx].y < lm[pipIdx].y
}

export function useGestures() {

  watch(landmarks, (lm) => {
    if (!lm || lm.length < 21) {
      isPinching.value    = false
      isOpenHand.value    = false
      isIndexUp.value     = false
      pinchStrength.value = 0
      return
    }

    // ─── Detectar PINZA (pulgar + índice) ───
    const thumbTip  = lm[THUMB_TIP]
    const indexTip  = lm[INDEX_TIP]
    const dist      = distance2D(thumbTip, indexTip)

    pinchStrength.value = Math.max(0, 1 - dist / PINCH_THRESHOLD)

    const newPinching = dist < PINCH_THRESHOLD

    if (newPinching !== lastPinchState) {
      clearTimeout(pinchDebounce)
      pinchDebounce = setTimeout(() => {
        isPinching.value = newPinching
        lastPinchState   = newPinching
      }, newPinching ? 0 : 150) // Activar inmediato, desactivar con delay
    }

    // ─── Detectar MANO ABIERTA (todos los dedos extendidos) ───
    const indexExt  = isFingerExtended(lm, 8, 6)
    const middleExt = isFingerExtended(lm, 12, 10)
    const ringExt   = isFingerExtended(lm, 16, 14)
    const pinkyExt  = isFingerExtended(lm, 20, 18)

    isOpenHand.value = indexExt && middleExt && ringExt && pinkyExt

    // ─── Detectar ÍNDICE ARRIBA (solo índice extendido) ───
    isIndexUp.value = indexExt && !middleExt && !ringExt && !pinkyExt

  }, { deep: true })

  return {
    isPinching,
    isOpenHand,
    isIndexUp,
    pinchStrength,
  }
}

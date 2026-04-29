<template>
  <button
    :id="buttonId"
    class="hand-btn"
    :class="[
      variantClass,
      { 'is-hovered': isHovered, 'is-clicking': isClicking }
    ]"
    :style="buttonStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    :disabled="disabled"
  >
    <!-- Contenido del botón -->
    <slot />

    <!-- Anillo de dwell (progreso de tiempo) -->
    <div class="dwell-overlay" v-if="isHovered && !isPinching">
      <svg class="dwell-svg" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          stroke-width="4"
        />
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          :stroke="dwellColor"
          stroke-width="4"
          stroke-linecap="round"
          :stroke-dasharray="289"
          :stroke-dashoffset="289 * (1 - dwellProgress)"
          transform="rotate(-90 50 50)"
          style="transition: stroke-dashoffset 0.05s linear"
        />
      </svg>
    </div>

    <!-- Flash de click -->
    <div class="click-flash" v-if="isClicking" />
  </button>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { cursorX, cursorY, isVisible } from '@/composables/useHandCursor.js'
import { isPinching } from '@/composables/useGestures.js'

const props = defineProps({
  buttonId:    { type: String, default: () => `hand-btn-${Math.random().toString(36).slice(2,7)}` },
  variant:     { type: String, default: 'purple' },
  dwellMs:     { type: Number, default: 800 },
  disabled:    { type: Boolean, default: false },
  size:        { type: String, default: 'md' },
})

const emit = defineEmits(['click', 'hover-start', 'hover-end'])

const isHovered  = ref(false)
const isClicking = ref(false)
const dwellProgress = ref(0)
let dwellInterval = null
let dwellStart    = null
let pinchWasActive = false

// ─── Colores por variante ───
const VARIANTS = {
  purple: { bg: 'from-edu-purple to-edu-indigo', dwell: '#7C3AED', glow: 'rgba(124,58,237,0.5)' },
  cyan:   { bg: 'from-edu-cyan to-edu-teal',     dwell: '#06B6D4', glow: 'rgba(6,182,212,0.5)'  },
  orange: { bg: 'from-edu-orange to-edu-yellow', dwell: '#F97316', glow: 'rgba(249,115,22,0.5)' },
  pink:   { bg: 'from-edu-pink to-edu-purple',   dwell: '#EC4899', glow: 'rgba(236,72,153,0.5)' },
  green:  { bg: 'from-edu-green to-edu-teal',    dwell: '#10B981', glow: 'rgba(16,185,129,0.5)' },
}

const variantClass = computed(() => {
  const v = VARIANTS[props.variant] || VARIANTS.purple
  return `bg-gradient-to-br ${v.bg}`
})

const dwellColor = computed(() => {
  const v = VARIANTS[props.variant] || VARIANTS.purple
  return v.dwell
})

const buttonStyle = computed(() => {
  const v = VARIANTS[props.variant] || VARIANTS.purple
  if (isHovered.value) {
    return { boxShadow: `0 0 30px ${v.glow}, 0 8px 32px rgba(0,0,0,0.4)` }
  }
  return {}
})

// ─── Detección de hover por posición del cursor ───
let hoverCheckInterval = null
const mountTime = Date.now()

function startHoverCheck() {
  hoverCheckInterval = setInterval(() => {
    if (!isVisible.value || props.disabled) {
      if (isHovered.value) endHover()
      return
    }

    const el = document.getElementById(props.buttonId)
    if (!el) return

    const rect = el.getBoundingClientRect()
    const cx   = cursorX.value
    const cy   = cursorY.value

    // Cooldown global de montaje para evitar clics accidentales al cambiar de vista
    if (Date.now() - mountTime < 600) return

    const over = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom

    if (over && !isHovered.value) startHover()
    if (!over && isHovered.value) endHover()

    // Clic por pinza mientras está sobre el botón
    if (over && isPinching.value && !pinchWasActive) {
      pinchWasActive = true
      triggerClick()
    }
    if (!isPinching.value) pinchWasActive = false
  }, 30)
}

function startHover() {
  if (props.disabled) return
  isHovered.value  = true
  dwellProgress.value = 0
  dwellStart = Date.now()
  emit('hover-start')

  dwellInterval = setInterval(() => {
    const elapsed = Date.now() - dwellStart
    dwellProgress.value = Math.min(elapsed / props.dwellMs, 1)

    if (dwellProgress.value >= 1) {
      clearInterval(dwellInterval)
      triggerClick()
    }
  }, 16)
}

function endHover() {
  isHovered.value     = false
  dwellProgress.value = 0
  clearInterval(dwellInterval)
  emit('hover-end')
}

function triggerClick() {
  if (props.disabled) return
  isClicking.value = true
  setTimeout(() => { isClicking.value = false }, 300)
  emit('click')
}

function handleMouseEnter() { /* Fallback para mouse normal */ }
function handleMouseLeave() { }
function handleClick()      { emit('click') }

startHoverCheck()

onUnmounted(() => {
  clearInterval(hoverCheckInterval)
  clearInterval(dwellInterval)
})
</script>

<style scoped>
.hand-btn {
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: 16px;
  cursor: none;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  color: white;
  transition: transform 0.2s ease, filter 0.2s ease;
  padding: 16px 32px;
  font-size: 1.1rem;
  user-select: none;
}

.hand-btn:disabled {
  opacity: 0.4;
}

.hand-btn.is-hovered {
  transform: scale(1.05) translateY(-2px);
  filter: brightness(1.2);
}

.hand-btn.is-clicking {
  transform: scale(0.95);
  filter: brightness(1.5);
}

.dwell-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.dwell-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  opacity: 0.8;
}

.click-flash {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.3);
  border-radius: inherit;
  animation: flash 0.3s ease-out forwards;
}

@keyframes flash {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
</style>

<template>
  <!-- Cursor de mano: invisible cuando no hay detección -->
  <Transition name="cursor-fade">
    <div
      v-if="isVisible"
      class="hand-cursor"
      :class="{ pinching: isPinching }"
      :style="{
        left: cursorX + 'px',
        top:  cursorY + 'px',
      }"
      role="none"
      aria-hidden="true"
    >
      <!-- Anillo exterior -->
      <div class="cursor-ring" :class="{ 'ring-pinch': isPinching }" />

      <!-- Punto central -->
      <div class="cursor-dot" :class="{ 'dot-pinch': isPinching }" />

      <!-- Anillo de dwell (progreso) -->
      <svg
        v-if="dwellProgress > 0"
        class="dwell-ring"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="22" cy="22" r="20"
          stroke="rgba(6,182,212,0.3)"
          stroke-width="2"
        />
        <circle
          cx="22" cy="22" r="20"
          stroke="#06B6D4"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="125.6"
          :stroke-dashoffset="125.6 * (1 - dwellProgress)"
          transform="rotate(-90 22 22)"
          style="transition: stroke-dashoffset 0.05s linear"
        />
      </svg>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { useHandCursor } from '@/composables/useHandCursor.js'
import { useGestures }   from '@/composables/useGestures.js'

const { cursorX, cursorY, isVisible } = useHandCursor()
const { isPinching } = useGestures()

// dwellProgress es controlado externamente por HandButton
const dwellProgress = ref(0)

// Exponer para que HandButton pueda actualizar el progreso
defineExpose({ dwellProgress })
</script>

<style scoped>
.cursor-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2.5px solid rgba(124, 58, 237, 0.8);
  background: rgba(124, 58, 237, 0.12);
  transition: all 0.15s ease;
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.5),
              inset 0 0 8px rgba(124, 58, 237, 0.2);
}

.cursor-ring.ring-pinch {
  border-color: rgba(6, 182, 212, 0.9);
  background: rgba(6, 182, 212, 0.2);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.7),
              inset 0 0 12px rgba(6, 182, 212, 0.3);
}

.cursor-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7C3AED;
  transform: translate(-50%, -50%);
  transition: all 0.15s ease;
  box-shadow: 0 0 6px rgba(124, 58, 237, 0.8);
}

.cursor-dot.dot-pinch {
  background: #06B6D4;
  width: 5px;
  height: 5px;
  box-shadow: 0 0 10px rgba(6, 182, 212, 1);
}

.dwell-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
}

/* Transición del cursor */
.cursor-fade-enter-active,
.cursor-fade-leave-active {
  transition: opacity 0.3s ease;
}
.cursor-fade-enter-from,
.cursor-fade-leave-to {
  opacity: 0;
}
</style>

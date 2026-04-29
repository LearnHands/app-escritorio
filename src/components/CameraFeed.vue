<template>
  <!-- Mini indicador de estado — esquina inferior izquierda -->
  <div class="camera-status-widget" style="z-index:40">

    <!-- Video oculto que usa MediaPipe internamente -->
    <video
      ref="videoRef"
      id="mediapipe-video"
      class="hidden-video"
      autoplay
      playsinline
      muted
    />

    <!-- Chip de estado -->
    <div class="status-chip" :class="statusClass">
      <div class="chip-dot" />
      <span class="chip-text">{{ statusText }}</span>
      <span v-if="isDetecting" class="chip-hand">🖐️</span>
    </div>

    <!-- Indicador de gesto actual -->
    <Transition name="gesture-fade">
      <div v-if="gestureLabel" class="gesture-pill">
        {{ gestureLabel }}
      </div>
    </Transition>

    <!-- Error de cámara o MediaPipe -->
    <div v-if="hasError || mpError" class="error-chip">
      ⚠️ {{ mpError || errorMsg }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCamera }    from '@/composables/useCamera.js'
import { useMediaPipe } from '@/composables/useMediaPipe.js'
import { useGestures }  from '@/composables/useGestures.js'

const emit = defineEmits(['stream-ready'])

const videoRef = ref(null)

const { stream, isActive, hasError, errorMsg, startCamera } = useCamera()
const { initMediaPipe, stopMediaPipe, isDetecting, mpError } = useMediaPipe()
const { isPinching, isOpenHand, isIndexUp }                 = useGestures()

// Estado chip
const statusClass = computed(() => ({
  'chip-active':    isActive.value && !hasError.value,
  'chip-detecting': isDetecting.value,
  'chip-error':     hasError.value,
}))

const statusText = computed(() => {
  if (hasError.value)    return 'Sin cámara'
  if (isDetecting.value) return 'Mano detectada'
  if (isActive.value)    return 'Cámara activa'
  return 'Iniciando...'
})

// Gesto actual
const gestureLabel = computed(() => {
  if (isPinching.value)   return '🤏 Pinza — Clic'
  if (isOpenHand.value)   return '✋ Mano abierta'
  if (isIndexUp.value)    return '☝️ Apuntando'
  return ''
})

onMounted(async () => {
  try {
    await startCamera(videoRef.value)

    // Emitir el stream al padre (App.vue) para el video de fondo
    emit('stream-ready', stream.value)

    // Iniciar MediaPipe con el video oculto
    await initMediaPipe(videoRef.value)
  } catch (e) {
    console.error('[EduMotion] CameraFeed error:', e)
  }
})

onUnmounted(() => {
  stopMediaPipe()
})
</script>

<style scoped>
.camera-status-widget {
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

/* Video oculto que procesa MediaPipe */
.hidden-video {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 640px;
  height: 480px;
  opacity: 0.01;
  pointer-events: none;
}

/* Chip de estado */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  background: rgba(10, 10, 26, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.4s ease;
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #374151;
  transition: background 0.4s;
}

.chip-active .chip-dot {
  background: #06B6D4;
  box-shadow: 0 0 6px rgba(6, 182, 212, 0.8);
}

.chip-detecting {
  background: rgba(124, 58, 237, 0.25);
  border-color: rgba(124, 58, 237, 0.5);
  color: #DDD6FE;
}

.chip-detecting .chip-dot {
  background: #7C3AED;
  box-shadow: 0 0 8px rgba(124, 58, 237, 1);
  animation: pulse-dot 1.2s ease-in-out infinite;
}

.chip-error {
  border-color: rgba(239, 68, 68, 0.4);
  color: #FCA5A5;
}

.chip-text { flex: 1; }
.chip-hand { font-size: 1rem; }

/* Pill de gesto */
.gesture-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.82rem;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
  background: rgba(124, 58, 237, 0.35);
  border: 1px solid rgba(124, 58, 237, 0.6);
  color: #EDE9FE;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 0 16px rgba(124, 58, 237, 0.3);
}

.error-chip {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #FCA5A5;
  font-family: 'Nunito', sans-serif;
  max-width: 200px;
}

/* Transición de gesto */
.gesture-fade-enter-active,
.gesture-fade-leave-active {
  transition: all 0.25s ease;
}
.gesture-fade-enter-from,
.gesture-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.8); }
}
</style>

<template>
  <div class="app-root">

    <!-- ═══════════════════════════════════════════════
         CAPA 1 (z-0): Video de cámara — fondo completo
         ═══════════════════════════════════════════════ -->
    <video
      v-show="!isLogin"
      ref="bgVideoRef"
      id="bg-camera-video"
      class="bg-video"
      autoplay
      playsinline
      muted
    />

    <!-- ═══════════════════════════════════════════════
         CAPA 2 (z-10): Overlay oscuro semitransparente
         ═══════════════════════════════════════════════ -->
    <div class="bg-overlay" />

    <!-- ═══════════════════════════════════════════════
         CAPA 3 (z-20): Canvas de landmarks de la mano
         ═══════════════════════════════════════════════ -->
    <canvas v-show="!isLogin" ref="landmarksBg" class="landmarks-bg-canvas" />

    <!-- ═══════════════════════════════════════════════
         CAPA 4 (z-30): UI — vistas del router
         ═══════════════════════════════════════════════ -->
    <div class="ui-layer">
      <router-view v-slot="{ Component }">
        <transition name="view" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- ═══════════════════════════════════════════════
         CAPA 5 (z-40): Mini preview cámara + controles
         ═══════════════════════════════════════════════ -->
    <CameraFeed v-if="!isLogin" :bg-video-ref="bgVideoRef" @stream-ready="onStreamReady" />

    <!-- ═══════════════════════════════════════════════
         CAPA 5.5 (z-45): UI Global (Puntos/Logros)
         ═══════════════════════════════════════════════ -->
    <div class="global-score-widget glass-dark">
      <span class="score-icon animate-float-slow">⭐</span>
      <div class="score-info">
        <span class="score-label">PUNTOS</span>
        <span class="score-value font-display">{{ score }}</span>
      </div>
      
      <!-- Animación de puntos añadidos -->
      <Transition name="score-pop">
        <div v-if="showScoreAnim" class="score-added">
          +{{ lastAddedScore }}
        </div>
      </Transition>
    </div>

    <!-- Botón flotante de Cerrar Sesión (solo visible fuera de login usando ratón) -->
    <button v-if="!isLogin" @click="handleLogout" class="fixed bottom-4 right-4 z-50 glass px-4 py-2 rounded-xl text-white/50 hover:text-white hover:bg-red-500/20 text-xs transition-colors pointer-events-auto">
      Cerrar Sesión
    </button>

    <!-- ═══════════════════════════════════════════════
         CAPA 6 (z-50): Cursor virtual de mano
         ═══════════════════════════════════════════════ -->
    <HandCursor v-if="!isLogin" />

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HandCursor from '@/components/HandCursor.vue'
import CameraFeed from '@/components/CameraFeed.vue'
import { landmarks, isDetecting } from '@/composables/useMediaPipe.js'
import { stream } from '@/composables/useCamera.js'
import { useScore } from '@/composables/useScore.js'
import { logout } from '@/services/db.js'

const route = useRoute()
const router = useRouter()
const isLogin = computed(() => route.path === '/')

const bgVideoRef    = ref(null)
const landmarksBg   = ref(null)

const { score, showScoreAnim, lastAddedScore } = useScore()

// ─── Dibujar landmarks en el canvas de fondo completo ───
let animFrameId = null

function drawBgLandmarks() {
  const canvas = landmarksBg.value
  if (!canvas) { animFrameId = requestAnimationFrame(drawBgLandmarks); return }

  const ctx  = canvas.getContext('2d')
  const w    = canvas.width
  const h    = canvas.height
  ctx.clearRect(0, 0, w, h)

  const lm = landmarks.value
  if (lm && lm.length === 21) {

    const CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ]

    // Líneas de conexión — trazo suave brillante
    ctx.lineWidth   = 2
    ctx.shadowBlur  = 8
    ctx.shadowColor = 'rgba(124,58,237,0.8)'
    ctx.strokeStyle = 'rgba(167,139,250,0.6)'
    for (const [a, b] of CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo((1 - lm[a].x) * w, lm[a].y * h)
      ctx.lineTo((1 - lm[b].x) * w, lm[b].y * h)
      ctx.stroke()
    }

    // Puntos por dedo con colores
    const COLORS = [
      '#EC4899',                                    // 0  muñeca
      '#F97316','#F97316','#F97316','#F97316',      // 1-4  pulgar
      '#06B6D4','#06B6D4','#06B6D4','#06B6D4',      // 5-8  índice
      '#A78BFA','#A78BFA','#A78BFA','#A78BFA',      // 9-12 medio
      '#10B981','#10B981','#10B981','#10B981',      // 13-16 anular
      '#7C3AED','#7C3AED','#7C3AED','#7C3AED',      // 17-20 meñique
    ]

    for (let i = 0; i < 21; i++) {
      const x   = (1 - lm[i].x) * w
      const y   = lm[i].y * h
      const r   = i === 0 ? 8 : (i % 4 === 0 ? 7 : 4)
      const col = COLORS[i]

      // Halo exterior (usando alpha directamente)
      const haloGrad = ctx.createRadialGradient(x, y, 0, x, y, r + 10)
      haloGrad.addColorStop(0, col + 'AA')
      haloGrad.addColorStop(1, col + '00')
      ctx.beginPath()
      ctx.arc(x, y, r + 10, 0, Math.PI * 2)
      ctx.fillStyle  = haloGrad
      ctx.shadowBlur = 0
      ctx.fill()

      // Punto interior sólido
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle   = col
      ctx.shadowBlur  = 12
      ctx.shadowColor = col
      ctx.fill()
    }

    // Aura de la palma (entre landmarks 0 y 9)
    const palmX = (1 - lm[9].x) * w
    const palmY = lm[9].y * h
    const grad  = ctx.createRadialGradient(palmX, palmY, 0, palmX, palmY, 80)
    grad.addColorStop(0, 'rgba(124,58,237,0.12)')
    grad.addColorStop(1, 'rgba(124,58,237,0)')
    ctx.beginPath()
    ctx.arc(palmX, palmY, 80, 0, Math.PI * 2)
    ctx.fillStyle  = grad
    ctx.shadowBlur = 0
    ctx.fill()
  }

  animFrameId = requestAnimationFrame(drawBgLandmarks)
}

// Resize canvas al tamaño de la ventana
function resizeCanvas() {
  if (!landmarksBg.value) return
  landmarksBg.value.width  = window.innerWidth
  landmarksBg.value.height = window.innerHeight
}

// Vincular el stream de la cámara al video de fondo reactivamente
watch(stream, (newStream) => {
  if (bgVideoRef.value && newStream) {
    bgVideoRef.value.srcObject = newStream
    bgVideoRef.value.play().catch(e => console.error(e))
  }
}, { immediate: true })

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  drawBgLandmarks()
})

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<style scoped>
/* Stack de capas */
.app-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0A0A1A;
}

/* CAPA 1: video de cámara fondo completo */
.bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);   /* espejado — natural para el usuario */
  z-index: 0;
  opacity: 0.85;
}

/* CAPA 2: overlay oscuro semitransparente */
.bg-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: linear-gradient(
    135deg,
    rgba(10, 10, 26, 0.4) 0%,
    rgba(15, 15, 53, 0.3) 50%,
    rgba(10, 10, 26, 0.5) 100%
  );
  /* Efecto viñeta en los bordes */
  box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.5);
}

/* CAPA 3: canvas de landmarks a pantalla completa */
.landmarks-bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  pointer-events: none;
}

/* CAPA 4: capa de UI */
.ui-layer {
  position: absolute;
  inset: 0;
  z-index: 30;
}

/* Transiciones de vista */
.view-enter-active,
.view-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.view-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}
.view-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.98);
}

/* Widget Global de Puntos */
.global-score-widget {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 8px 16px 8px 12px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 45;
  pointer-events: none;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1);
}

.score-icon { font-size: 1.5rem; }

.score-info {
  display: flex;
  flex-direction: column;
}

.score-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.1em;
  line-height: 1;
}

.score-value {
  font-size: 1.25rem;
  color: #FBBF24;
  line-height: 1;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.score-added {
  position: absolute;
  top: 100%;
  right: 16px;
  margin-top: 8px;
  font-size: 1.25rem;
  font-weight: 800;
  color: #10B981;
  text-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
}

.score-pop-enter-active { animation: pop-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.score-pop-leave-active { transition: all 0.3s ease-in; }
.score-pop-leave-to { opacity: 0; transform: translateY(-10px); }

@keyframes pop-up {
  0% { opacity: 0; transform: translateY(20px) scale(0.5); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
</style>

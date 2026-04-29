<template>
  <div class="home-view relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">

    <!-- Orbes de fondo animados -->
    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="orb orb-3" />

    <!-- Logo y título -->
    <div class="relative z-10 flex flex-col items-center gap-6 animate-pop">

      <!-- Ícono principal -->
      <div class="logo-container animate-float">
        <div class="logo-inner">
          <span class="logo-emoji">🖐️</span>
        </div>
        <div class="logo-ring" />
        <div class="logo-ring ring-2" />
      </div>

      <!-- Título -->
      <div class="text-center">
        <h1 class="title text-shimmer">EduMotion</h1>
        <p class="subtitle">Aprende con tus manos</p>
        <p class="tagline">Fe y Alegría Ecuador · 2024</p>
      </div>

      <!-- Instrucción de interacción -->
      <div class="hint-box glass">
        <div class="hint-icon">✋</div>
        <div class="hint-text">
          <p class="hint-title">¿Cómo funciona?</p>
          <p class="hint-desc">Mueve tu mano frente a la cámara para controlar la app</p>
        </div>
      </div>

      <!-- Botón de inicio -->
      <HandButton
        button-id="btn-start"
        variant="purple"
        :dwell-ms="1000"
        class="start-btn"
        @click="goToMenu"
      >
        <span class="flex items-center gap-3">
          <span class="text-2xl">🚀</span>
          <span>¡Comenzar!</span>
        </span>
      </HandButton>

      <!-- Estado de cámara -->
      <div class="camera-status" :class="{ 'active': cameraActive }">
        <div class="status-indicator" />
        <span>{{ cameraActive ? '📷 Cámara lista' : '⏳ Iniciando cámara...' }}</span>
      </div>

    </div>

    <!-- Elementos decorativos flotantes -->
    <div class="floating-emojis">
      <span v-for="(e, i) in emojis" :key="i" class="float-emoji" :style="e.style">{{ e.char }}</span>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HandButton from '@/components/HandButton.vue'
import { isActive } from '@/composables/useCamera.js'

const router = useRouter()
const cameraActive = isActive

const EMOJI_LIST = ['✏️','🎹','🧩','🎨','⭐','🌟','💡','🎯','📚','🎮']
const emojis = EMOJI_LIST.map((char, i) => ({
  char,
  style: {
    left:            `${5 + (i * 9.5)}%`,
    animationDelay:  `${i * 0.4}s`,
    fontSize:        `${Math.random() * 20 + 20}px`,
    animationDuration: `${4 + Math.random() * 3}s`,
  }
}))

function goToMenu() {
  router.push('/menu')
}
</script>

<style scoped>
.home-view {
  /* Fondo transparente para mostrar la cámara */
  background: transparent;
}

/* Orbes de fondo */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 8s ease-in-out infinite;
}
.orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #7C3AED, transparent);
  top: -100px; left: -100px;
  animation-delay: 0s;
}
.orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #06B6D4, transparent);
  bottom: -80px; right: -80px;
  animation-delay: -3s;
}
.orb-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, #EC4899, transparent);
  top: 40%; left: 60%;
  animation-delay: -6s;
}

/* Logo */
.logo-container {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-inner {
  width: 90px;
  height: 90px;
  border-radius: 28px;
  background: linear-gradient(135deg, #7C3AED, #4F46E5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(124,58,237,0.5),
              inset 0 1px 0 rgba(255,255,255,0.2);
  position: relative;
  z-index: 2;
}

.logo-emoji {
  font-size: 44px;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
}

.logo-ring {
  position: absolute;
  inset: -8px;
  border-radius: 36px;
  border: 2px solid rgba(124,58,237,0.4);
  animation: spin-slow 8s linear infinite;
}

.logo-ring.ring-2 {
  inset: -20px;
  border-color: rgba(6,182,212,0.3);
  animation-direction: reverse;
  animation-duration: 12s;
}

/* Texto */
.title {
  font-family: 'Fredoka One', cursive;
  font-size: 4.5rem;
  line-height: 1;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 1.4rem;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
}

.tagline {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.4);
  margin-top: 4px;
  letter-spacing: 0.05em;
}

/* Hint box */
.hint-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 16px;
  max-width: 380px;
}

.hint-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.hint-title {
  font-weight: 800;
  color: white;
  font-size: 0.95rem;
}

.hint-desc {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.6);
}

/* Botón inicio */
.start-btn {
  font-size: 1.3rem !important;
  padding: 20px 48px !important;
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(124,58,237,0.4);
}

/* Estado cámara */
.camera-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.5);
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
}

.camera-status.active {
  color: rgba(16,185,129,0.9);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

/* Emojis flotantes */
.floating-emojis {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.float-emoji {
  position: absolute;
  bottom: -50px;
  opacity: 0.15;
  animation: float-up linear infinite;
}

@keyframes float-up {
  0%   { transform: translateY(0); opacity: 0.15; }
  50%  { opacity: 0.25; }
  100% { transform: translateY(-110vh); opacity: 0; }
}
</style>

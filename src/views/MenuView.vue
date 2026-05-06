<template>
  <div class="menu-view relative w-full h-screen flex flex-col overflow-hidden">

    <!-- Header -->
    <header class="menu-header glass-dark">
      <div class="flex items-center gap-3">
        <div class="header-logo">🖐️</div>
        <div>
          <h1 class="header-title font-display">EduMotion</h1>
          <p class="header-sub">Elige un módulo para comenzar</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <!-- Indicador de detección -->
        <div class="detect-badge" :class="{ 'detected': isDetecting }">
          <span class="detect-dot" />
          {{ isDetecting ? '✋ Mano detectada' : '👋 Mueve tu mano' }}
        </div>
        <HandButton
          button-id="btn-back-home"
          variant="purple"
          :dwell-ms="600"
          class="back-btn"
          @click="goHome"
        >
          🏠 Inicio
        </HandButton>
        <!-- Botón de Cerrar Sesión exclusivo para profesores/admin -->
        <button 
          @click="handleLogout" 
          class="glass px-4 py-2 rounded-xl text-white/40 hover:text-white hover:bg-red-500/20 text-[10px] uppercase font-bold tracking-widest transition-all pointer-events-auto border border-white/5 shadow-xl ml-2"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>

    <!-- Grid de módulos -->
    <main class="modules-grid">
      <!-- Tarjeta de Perfil / Logros -->
      <div class="module-card profile-card">
        <div class="card-bg" style="background: linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,95,70,0.2))" />
        <div class="card-content">
          <div class="card-icon animate-float" style="animation-delay: -1s">🏆</div>
          <h2 class="card-title">Mi Perfil</h2>
          <p class="card-desc">Sigue jugando y completando actividades para ganar puntos y subir de nivel.</p>
          
          <div class="profile-stats mt-4">
            <div class="stat-box">
              <span class="stat-label">NIVEL</span>
              <span class="stat-value font-display text-emerald-400">{{ level }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">PUNTOS</span>
              <span class="stat-value font-display text-amber-400">{{ score }}</span>
            </div>
          </div>
          
          <!-- Botón de reinicio de progreso -->
          <div class="w-full mt-4 pointer-events-auto">
            <button @click="confirmReset" class="text-[10px] text-white/30 hover:text-red-400 transition-colors flex items-center gap-1 mx-auto">
              <span>🔄</span> Reiniciar progreso del alumno
            </button>
          </div>
        </div>
        <div class="card-deco">⭐</div>
      </div>

      <!-- Módulos de juego -->
      <div
        v-for="module in modules"
        :key="module.id"
        class="module-card"
        :class="{ 'is-hovered': hoveredModule === module.id }"
        :style="{ '--card-color': module.color, '--card-glow': module.glow }"
      >
        <!-- Fondo del card -->
        <div class="card-bg" :style="{ background: module.gradient }" />

        <!-- Contenido -->
        <div class="card-content">
          <div class="card-icon animate-float" :style="{ animationDelay: module.delay }">
            {{ module.icon }}
          </div>
          <h2 class="card-title">{{ module.title }}</h2>
          <p class="card-desc">{{ module.desc }}</p>

          <!-- Tags -->
          <div class="card-tags">
            <span v-for="tag in module.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <!-- Botón de acceso -->
          <HandButton
            :button-id="`btn-module-${module.id}`"
            :variant="module.variant"
            :dwell-ms="700"
            class="module-btn"
            @click="goToModule(module.route)"
          >
            <span class="flex items-center gap-2">
              <span>{{ module.btnText }}</span>
              <span>→</span>
            </span>
          </HandButton>
        </div>

        <!-- Decoración esquina -->
        <div class="card-deco">{{ module.deco }}</div>
      </div>
    </main>

    <!-- Footer de instrucciones -->
    <footer class="menu-footer">
      <div class="glass rounded-2xl px-6 py-3 flex items-center gap-6">
        <div class="hint-item"><span>✋</span> Abre la mano = explorar</div>
        <div class="hint-item"><span>👆</span> Apunta con el dedo = mover</div>
        <div class="hint-item"><span>🤏</span> Pinza = seleccionar</div>
        <div class="hint-item"><span>⏳</span> Espera sobre botón = activar</div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import HandButton from '@/components/HandButton.vue'
import { isDetecting } from '@/composables/useMediaPipe.js'
import { useScore } from '@/composables/useScore.js'
import { logout } from '@/services/db.js'

const router = useRouter()
const hoveredModule = ref(null)

const { score, level, resetScore } = useScore()

function handleLogout() {
  logout()
  router.push('/')
}

function confirmReset() {
  if (confirm('¿Estás seguro de que quieres reiniciar todos los puntos y trofeos del alumno?')) {
    resetScore()
  }
}

const modules = [
  {
    id:       'drawing',
    icon:     '✏️',
    title:    'Dibujo en el Aire',
    desc:     'Dibuja con tu dedo índice. Elige colores y borra con la mano abierta.',
    tags:     ['Creatividad', 'Arte', 'Motor fino'],
    variant:  'purple',
    color:    '#7C3AED',
    glow:     'rgba(124,58,237,0.4)',
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))',
    route:    '/drawing',
    btnText:  'Dibujar',
    deco:     '🎨',
    delay:    '0s',
  },
  {
    id:       'piano',
    icon:     '🎹',
    title:    'Piano Interactivo',
    desc:     'Toca notas musicales con tus dedos. ¡Aprende música sin teclado!',
    tags:     ['Música', 'Sonido', 'Coordinación'],
    variant:  'cyan',
    color:    '#06B6D4',
    glow:     'rgba(6,182,212,0.4)',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(13,148,136,0.2))',
    route:    '/piano',
    btnText:  'Tocar',
    deco:     '🎵',
    delay:    '0.2s',
  },
  {
    id:       'puzzle',
    icon:     '🧩',
    title:    'Puzzle Interactivo',
    desc:     'Arrastra y encaja piezas con tu mano. ¡Completa la imagen!',
    tags:     ['Lógica', 'Espacial', 'Concentración'],
    variant:  'orange',
    color:    '#F97316',
    glow:     'rgba(249,115,22,0.4)',
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(245,158,11,0.2))',
    route:    '/puzzle',
    btnText:  'Jugar',
    deco:     '🏆',
    delay:    '0.4s',
  },
]

function goHome()           { router.push('/') }
function goToModule(route)  { router.push(route) }
</script>

<style scoped>
.menu-view {
  background: transparent;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  flex-shrink: 0;
}

.header-logo {
  font-size: 2rem;
  animation: float 4s ease-in-out infinite;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: white;
  line-height: 1;
}

.header-sub {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
}

.detect-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5);
  transition: all 0.3s;
}

.detect-badge.detected {
  background: rgba(16,185,129,0.15);
  border-color: rgba(16,185,129,0.4);
  color: #6EE7B7;
}

.detect-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.back-btn {
  padding: 10px 20px !important;
  font-size: 0.9rem !important;
  border-radius: 12px !important;
}

.modules-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 24px 32px;
  overflow: hidden;
}

.module-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: none;
}

.module-card:hover,
.module-card.is-hovered {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 60px var(--card-glow, rgba(124,58,237,0.3));
}

.card-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 28px;
  height: 100%;
}

.card-icon {
  font-size: 3.5rem;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
}

.card-title {
  font-family: 'Fredoka One', cursive;
  font-size: 1.8rem;
  color: white;
  line-height: 1.1;
}

.card-desc {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.7);
  line-height: 1.5;
  flex: 1;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.15);
}

.module-btn {
  width: 100%;
  padding: 14px 20px !important;
  font-size: 1rem !important;
  border-radius: 14px !important;
  justify-content: center;
}

.card-deco {
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 5rem;
  opacity: 0.08;
  transform: rotate(15deg);
  pointer-events: none;
  z-index: 0;
}

.menu-footer {
  padding: 12px 32px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.profile-stats {
  display: flex;
  gap: 12px;
  width: 100%;
}

.stat-box {
  flex: 1;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.1);
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.1em;
}

.stat-value {
  font-size: 1.8rem;
  line-height: 1.2;
}

.profile-card {
  pointer-events: none; /* No es clickeable, solo muestra info */
}
</style>

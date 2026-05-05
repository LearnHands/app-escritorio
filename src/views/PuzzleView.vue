<template>
  <div class="puzzle-view relative w-full h-screen overflow-hidden flex flex-col">

    <!-- Header -->
    <header class="glass-dark flex items-center justify-between px-8 py-4">
      <div class="flex items-center gap-3">
        <span class="text-3xl animate-float">🧩</span>
        <div>
          <h1 class="font-display text-2xl text-white">Puzzle Interactivo</h1>
          <p class="text-xs text-white/50">Completa la imagen con tu mano</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="glass px-4 py-2 rounded-xl text-sm text-white/70">
          ✅ {{ correctCount }}/{{ pieces.length }} piezas
        </div>
        <HandButton button-id="btn-reset-puzzle" variant="orange" :dwell-ms="600" class="text-sm px-4 py-2 rounded-xl" @click="resetPuzzle">
          🔄 Reiniciar
        </HandButton>
        <HandButton button-id="btn-back-puzzle" variant="cyan" :dwell-ms="600" class="text-sm px-4 py-2 rounded-xl" @click="goBack">
          🏠 Menú
        </HandButton>
      </div>
    </header>

    <!-- Área del puzzle -->
    <main class="flex-1 flex gap-8 px-8 py-6 overflow-hidden">

      <!-- Board: zona de destino -->
      <div class="puzzle-board glass" ref="boardRef">
        <h2 class="board-title">📍 Tablero</h2>
        <div class="board-grid" :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)` }">
          <div
            v-for="slot in slots"
            :key="slot.id"
            :id="`slot-${slot.id}`"
            class="board-slot"
            :class="{ 'slot-filled': slot.filled, 'slot-target': slot.id === nearestSlot }"
            :style="{ background: slot.filled ? slot.color + '30' : undefined, borderColor: slot.filled ? slot.color : undefined }"
          >
            <span v-if="slot.filled" class="slot-emoji">{{ slot.emoji }}</span>
            <span v-else class="slot-number">{{ slot.id + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- Piezas sueltas -->
      <div class="pieces-area glass flex-1">
        <h2 class="board-title">🎯 Piezas</h2>
        <div class="pieces-container">
          <div
            v-for="piece in availablePieces"
            :key="piece.id"
            :id="`piece-${piece.id}`"
            class="puzzle-piece"
            :class="{
              'is-grabbed': grabbedPiece?.id === piece.id,
              'is-correct': piece.placed
            }"
            :style="{
              background: piece.color,
              boxShadow: grabbedPiece?.id === piece.id ? `0 0 30px ${piece.color}` : undefined
            }"
          >
            <span class="piece-emoji">{{ piece.emoji }}</span>
            <span class="piece-label">{{ piece.label }}</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Pieza arrastrada (sigue el cursor) -->
    <Transition name="grab">
      <div
        v-if="grabbedPiece"
        class="dragged-piece"
        :style="{
          left: cursorX + 'px',
          top:  cursorY + 'px',
          background: grabbedPiece.color,
          boxShadow: `0 8px 32px ${grabbedPiece.color}80`
        }"
      >
        <span style="font-size:2rem">{{ grabbedPiece.emoji }}</span>
      </div>
    </Transition>

    <!-- Instrucciones -->
    <div class="glass fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl flex gap-6 text-sm text-white/60">
      <span>🤏 Mantén pinza = arrastrar</span>
      <span>✋ Suelta la pinza = soltar</span>
      <span>📍 Suelta cerca del slot = encajar</span>
    </div>

    <!-- Celebración -->
    <Transition name="celebrate">
      <div v-if="completed" class="celebration-overlay">
        <div class="celebration-content">
          <div class="celebration-emoji animate-bounce-slow">🏆</div>
          <h2 class="celebration-title font-display">¡Completado!</h2>
          <p class="celebration-sub">¡Excelente trabajo! Has ganado 50 puntos.</p>
          <HandButton button-id="btn-play-again" variant="green" :dwell-ms="800" class="mt-6 px-8 py-4 text-lg rounded-2xl" @click="resetPuzzle">
            🔄 Jugar de nuevo
          </HandButton>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import HandButton from '@/components/HandButton.vue'
import { cursorX, cursorY, isVisible } from '@/composables/useHandCursor.js'
import { isPinching, isOpenHand } from '@/composables/useGestures.js'
import { useScore } from '@/composables/useScore.js'

const router   = useRouter()
const boardRef = ref(null)

const { addPoints } = useScore()

const cols = 3
const rows = 2

const PIECE_DATA = [
  { id:0, emoji:'🌞', label:'Sol',    color:'#F59E0B', slotId:0 },
  { id:1, emoji:'🌙', label:'Luna',   color:'#7C3AED', slotId:1 },
  { id:2, emoji:'⭐', label:'Estrella',color:'#06B6D4', slotId:2 },
  { id:3, emoji:'🌈', label:'Arcoíris',color:'#10B981', slotId:3 },
  { id:4, emoji:'☁️', label:'Nube',   color:'#64748B', slotId:4 },
  { id:5, emoji:'⚡', label:'Rayo',   color:'#EC4899', slotId:5 },
]

const pieces = ref(PIECE_DATA.map(p => ({ ...p, placed: false })))
const slots  = ref(Array.from({ length: cols * rows }, (_, i) => ({
  id: i, filled: false, emoji: '', color: '', label: ''
})))

const grabbedPiece  = ref(null)
const nearestSlot   = ref(null)
const completed     = ref(false)

const availablePieces = computed(() => pieces.value.filter(p => !p.placed))
const correctCount    = computed(() => pieces.value.filter(p => p.placed).length)

const SNAP_DISTANCE = 100 // px

let wasOpen = false
let wasPinching = false

function getElementCenter(el) {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

// ─── Agarre y Soltar: mantener pinza ───
watch(isPinching, (val) => {
  if (val && !wasPinching && !grabbedPiece.value) {
    // Buscar pieza bajo cursor
    for (const piece of availablePieces.value) {
      const el = document.getElementById(`piece-${piece.id}`)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const cx   = cursorX.value, cy = cursorY.value
      if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
        grabbedPiece.value = piece
        break
      }
    }
  } else if (!val && wasPinching && grabbedPiece.value) {
    // Soltar pieza al dejar de hacer pinza
    trySnap()
    grabbedPiece.value = null
    nearestSlot.value  = null
  }
  wasPinching = val
})

// ─── Detectar slot más cercano mientras arrastra ───
let snapInterval = null
onMounted(() => {
  snapInterval = setInterval(() => {
    if (!grabbedPiece.value || !boardRef.value) return
    const cx = cursorX.value, cy = cursorY.value
    let minDist = Infinity

    slots.value.forEach(slot => {
      if (slot.filled) return
      const el = document.getElementById(`slot-${slot.id}`)
      if (!el) return
      const c = getElementCenter(el)
      const d = Math.hypot(cx - c.x, cy - c.y)
      if (d < minDist) { minDist = d; nearestSlot.value = slot.id }
    })

    if (minDist > SNAP_DISTANCE) nearestSlot.value = null
  }, 50)
})

onUnmounted(() => clearInterval(snapInterval))

function trySnap() {
  const piece = grabbedPiece.value
  if (!piece) return
  const cx = cursorX.value, cy = cursorY.value

  let bestSlot = null
  let minDist  = SNAP_DISTANCE

  slots.value.forEach(slot => {
    if (slot.filled) return
    const el = document.getElementById(`slot-${slot.id}`)
    if (!el) return
    const c = getElementCenter(el)
    const d = Math.hypot(cx - c.x, cy - c.y)
    if (d < minDist && slot.id === piece.slotId) {
      minDist  = d
      bestSlot = slot
    }
  })

  if (bestSlot) {
    // Encaje correcto
    bestSlot.filled = true
    bestSlot.emoji  = piece.emoji
    bestSlot.color  = piece.color
    piece.placed    = true
    if (correctCount.value === pieces.value.length) {
      setTimeout(() => { 
        completed.value = true 
        addPoints(50) // ¡Premio por completar el puzzle!
      }, 500)
    }
  }
}

function resetPuzzle() {
  pieces.value.forEach(p => { p.placed = false })
  slots.value.forEach(s => { s.filled = false; s.emoji = ''; s.color = '' })
  grabbedPiece.value = null
  nearestSlot.value  = null
  completed.value    = false
}

function goBack() { router.push('/menu') }
</script>

<style scoped>
.puzzle-board {
  width: 320px;
  flex-shrink: 0;
  padding: 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.board-title {
  font-family: 'Fredoka One', cursive;
  font-size: 1.2rem;
  color: white;
}

.board-grid {
  display: grid;
  gap: 10px;
  flex: 1;
}

.board-slot {
  aspect-ratio: 1;
  border-radius: 14px;
  border: 2px dashed rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  background: rgba(255,255,255,0.03);
}

.board-slot.slot-target {
  border-color: rgba(6,182,212,0.8);
  background: rgba(6,182,212,0.1);
  box-shadow: 0 0 20px rgba(6,182,212,0.3);
  transform: scale(1.05);
}

.board-slot.slot-filled {
  border-style: solid;
  background: rgba(255,255,255,0.08);
}

.slot-emoji { font-size: 2.5rem; }
.slot-number { font-size: 1.2rem; font-weight: 800; color: rgba(255,255,255,0.2); }

.pieces-area {
  padding: 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.pieces-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding: 8px;
}

.puzzle-piece {
  aspect-ratio: 1;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: none;
  transition: all 0.2s;
  border: 2px solid rgba(255,255,255,0.2);
}

.puzzle-piece.is-grabbed {
  opacity: 0.4;
  transform: scale(0.9);
}

.puzzle-piece.is-correct {
  opacity: 0.3;
  filter: grayscale(1);
}

.piece-emoji { font-size: 2.2rem; }
.piece-label { font-size: 0.8rem; font-weight: 700; color: white; }

.dragged-piece {
  position: fixed;
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 500;
  border: 2px solid rgba(255,255,255,0.4);
  animation: pop 0.2s ease-out;
}

.celebration-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10,10,26,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.celebration-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.celebration-emoji { font-size: 6rem; }
.celebration-title { font-size: 3.5rem; color: white; margin-top: 16px; }
.celebration-sub   { color: rgba(255,255,255,0.6); font-size: 1.2rem; }

.celebrate-enter-active { animation: pop 0.4s ease-out; }
.celebrate-leave-active { transition: opacity 0.3s; }
.celebrate-leave-to     { opacity: 0; }

.grab-enter-active { animation: pop 0.15s ease-out; }
.grab-leave-active { transition: opacity 0.15s; }
.grab-leave-to     { opacity: 0; }
</style>

<template>
  <div class="piano-view relative w-full h-screen overflow-hidden flex flex-col">

    <!-- Header -->
    <header class="piano-header glass-dark flex items-center justify-between px-8 py-4">
      <div class="flex items-center gap-3">
        <span class="text-3xl animate-float">🎹</span>
        <div>
          <h1 class="font-display text-2xl text-white">Piano Interactivo</h1>
          <p class="text-xs text-white/50">Toca las teclas con tu dedo</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="note-display glass px-4 py-2 rounded-xl text-lg font-bold text-cyan-300">
          {{ activeNote || '🎵 ...' }}
        </div>
        <HandButton button-id="btn-back-piano" variant="cyan" :dwell-ms="600" class="text-sm px-4 py-2 rounded-xl" @click="goBack">
          🏠 Menú
        </HandButton>
      </div>
    </header>

    <!-- Área del piano -->
    <main class="flex-1 flex flex-col items-center justify-start pt-20 gap-8 px-8">

      <!-- Visualizador de ondas -->
      <div class="wave-display glass w-full max-w-3xl h-16 rounded-2xl overflow-hidden flex items-center justify-center">
        <div class="wave-bars flex items-center gap-1 h-full px-4">
          <div
            v-for="(bar, i) in waveBars"
            :key="i"
            class="wave-bar"
            :style="{ height: bar + '%', background: activeColor }"
          />
        </div>
      </div>

      <!-- Teclas del piano -->
      <div class="piano-keyboard" ref="pianoRef">
        <!-- Teclas blancas -->
        <div class="white-keys">
          <div
            v-for="(note, i) in whiteNotes"
            :key="note.name"
            :id="`key-white-${i}`"
            class="white-key"
            :class="{ 'key-active': activeKeys.has(note.name) }"
            :style="activeKeys.has(note.name) ? { background: note.color, boxShadow: `0 0 20px ${note.color}` } : {}"
          >
            <span class="key-label">{{ note.label }}</span>
            <span class="note-name">{{ note.name }}</span>
          </div>
        </div>

        <!-- Teclas negras -->
        <div class="black-keys">
          <div
            v-for="(note, i) in blackNotes"
            :key="note.name"
            :id="`key-black-${i}`"
            class="black-key"
            :class="{ 'key-active-black': activeKeys.has(note.name), [note.position]: true }"
            :style="activeKeys.has(note.name) ? { background: note.color } : {}"
          />
        </div>
      </div>

      <!-- Instrucciones -->
      <div class="glass rounded-2xl px-6 py-3 flex gap-8 text-sm text-white/60">
        <span>☝️ Apunta a una tecla</span>
        <span>🤏 Pinza = tocar</span>
        <span>⏳ Hover 0.5s = tocar</span>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import HandButton from '@/components/HandButton.vue'
import { cursorX, cursorY, isVisible } from '@/composables/useHandCursor.js'
import { isPinching } from '@/composables/useGestures.js'
import { useScore } from '@/composables/useScore.js'

const router  = useRouter()
const pianoRef = ref(null)

const { addPoints } = useScore()
let notesPlayedCount = 0

const activeNote  = ref('')
const activeColor = ref('#06B6D4')
const activeKeys  = ref(new Set())
const waveBars    = ref(Array(24).fill(20))

let audioCtx = null
let waveInterval = null

// Frecuencias de las notas (octava 4)
const NOTE_FREQ = {
  'Do':  261.63, 'Re':  293.66, 'Mi':  329.63,
  'Fa':  349.23, 'Sol': 392.00, 'La':  440.00,
  'Si':  493.88, 'Do2': 523.25,
  'Do#': 277.18, 'Re#': 311.13, 'Fa#': 369.99,
  'Sol#':415.30, 'La#': 466.16,
}

const NOTE_COLORS = [
  '#7C3AED','#4F46E5','#06B6D4','#0D9488',
  '#10B981','#84CC16','#F59E0B','#EC4899',
]

const whiteNotes = [
  { name:'Do',  label:'Do',  color: NOTE_COLORS[0] },
  { name:'Re',  label:'Re',  color: NOTE_COLORS[1] },
  { name:'Mi',  label:'Mi',  color: NOTE_COLORS[2] },
  { name:'Fa',  label:'Fa',  color: NOTE_COLORS[3] },
  { name:'Sol', label:'Sol', color: NOTE_COLORS[4] },
  { name:'La',  label:'La',  color: NOTE_COLORS[5] },
  { name:'Si',  label:'Si',  color: NOTE_COLORS[6] },
  { name:'Do2', label:'Do',  color: NOTE_COLORS[7] },
]

const blackNotes = [
  { name:'Do#',  color:'#A78BFA', position:'pos-1' },
  { name:'Re#',  color:'#67E8F9', position:'pos-2' },
  { name:'Fa#',  color:'#6EE7B7', position:'pos-4' },
  { name:'Sol#', color:'#FDE68A', position:'pos-5' },
  { name:'La#',  color:'#FCA5A5', position:'pos-6' },
]

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
}

function playNote(noteName) {
  initAudio()
  const freq = NOTE_FREQ[noteName]
  if (!freq) return

  const osc   = audioCtx.createOscillator()
  const gain  = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.type      = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.5, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2)
  osc.start()
  osc.stop(audioCtx.currentTime + 1.2)

  activeNote.value  = noteName
  activeKeys.value.add(noteName)
  triggerWave()
  setTimeout(() => activeKeys.value.delete(noteName), 400)

  // Gamificación: sumar 5 puntos cada 20 notas
  notesPlayedCount++
  if (notesPlayedCount >= 20) {
    addPoints(5)
    notesPlayedCount = 0
  }
}

function triggerWave() {
  waveBars.value = waveBars.value.map(() => Math.random() * 80 + 10)
  setTimeout(() => { waveBars.value = Array(24).fill(20) }, 500)
}

// Detección de teclas por posición del cursor
let keyHoverTimers = {}
let lastPinch = false

function checkKeyHover() {
  if (!isVisible.value || !pianoRef.value) return

  const allKeys = pianoRef.value.querySelectorAll('[id^="key-white-"], [id^="key-black-"]')
  const cx = cursorX.value
  const cy = cursorY.value

  allKeys.forEach((keyEl, i) => {
    const rect     = keyEl.getBoundingClientRect()
    const over     = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom
    const noteData = i < 8 ? whiteNotes[i] : blackNotes[i - 8]
    if (!noteData) return

    if (over) {
      activeColor.value = noteData.color
      if (!keyHoverTimers[noteData.name]) {
        keyHoverTimers[noteData.name] = setTimeout(() => {
          playNote(noteData.name)
          delete keyHoverTimers[noteData.name]
        }, 500)
      }
    } else {
      clearTimeout(keyHoverTimers[noteData.name])
      delete keyHoverTimers[noteData.name]
    }
  })
}

watch(isPinching, (val) => {
  if (val && !lastPinch && isVisible.value) {
    // Tocar la nota de la tecla bajo el cursor
    const allKeys = pianoRef.value?.querySelectorAll('[id^="key-white-"]')
    if (!allKeys) return
    const cx = cursorX.value, cy = cursorY.value
    allKeys.forEach((el, i) => {
      const rect = el.getBoundingClientRect()
      if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
        playNote(whiteNotes[i].name)
      }
    })
  }
  lastPinch = val
})

let hoverInterval = null
onMounted(() => {
  hoverInterval = setInterval(checkKeyHover, 50)
})
onUnmounted(() => {
  clearInterval(hoverInterval)
  Object.values(keyHoverTimers).forEach(clearTimeout)
})

function goBack() { router.push('/menu') }
</script>

<style scoped>
.piano-header { flex-shrink: 0; }

.piano-keyboard {
  position: relative;
  display: inline-block;
}

.white-keys {
  display: flex;
  gap: 4px;
}

.white-key {
  width: 80px;
  height: 220px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(200,200,220,0.95));
  border-radius: 0 0 12px 12px;
  border: 2px solid rgba(255,255,255,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 12px;
  cursor: none;
  transition: all 0.1s ease;
  position: relative;
  box-shadow: 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5);
}

.white-key.key-active {
  transform: translateY(4px);
}

.key-label { font-size: 1.1rem; }
.note-name {
  font-size: 0.75rem;
  font-weight: 800;
  color: rgba(30,30,60,0.6);
}

.black-keys {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.black-key {
  position: absolute;
  width: 52px;
  height: 140px;
  background: linear-gradient(to bottom, #1E1E4A, #0A0A1A);
  border-radius: 0 0 8px 8px;
  top: 0;
  cursor: none;
  transition: all 0.1s;
  box-shadow: 2px 8px 16px rgba(0,0,0,0.8);
  pointer-events: auto;
  z-index: 10;
}

/* Posiciones de las teclas negras */
.pos-1  { left: calc(84px * 0 + 56px) }
.pos-2  { left: calc(84px * 1 + 56px) }
.pos-4  { left: calc(84px * 3 + 56px) }
.pos-5  { left: calc(84px * 4 + 56px) }
.pos-6  { left: calc(84px * 5 + 56px) }

.black-key.key-active-black {
  transform: translateY(3px);
}

.wave-bar {
  width: 6px;
  border-radius: 3px;
  min-height: 4px;
  transition: height 0.15s ease;
}
</style>

<template>
  <div class="drawing-view relative w-full h-screen overflow-hidden">

    <canvas ref="drawCanvas" class="draw-canvas" id="drawing-canvas" />

    <!-- Toolbar izquierda -->
    <aside class="toolbar glass-dark">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xl">✏️</span>
        <span class="font-display text-white text-lg">Dibujo</span>
      </div>

      <p class="section-label">Color</p>
      <div class="color-palette">
        <HandButton v-for="c in colors" :key="c.v" :button-id="`color-btn-${c.name}`"
          class="color-dot" :class="{ selected: selectedColor === c.v }"
          :style="{ background: c.v }" :dwell-ms="500" @click="selectedColor = c.v" />
      </div>

      <p class="section-label mt-2">Pincel</p>
      <div class="flex justify-around py-1">
        <HandButton v-for="s in [4,8,14,22]" :key="s" :button-id="`brush-${s}`"
          class="brush-btn" :class="{ selected: brushSize === s }" :dwell-ms="500" @click="brushSize = s">
          <div class="brush-dot" :style="{ width:s+'px', height:s+'px', background: selectedColor }" />
        </HandButton>
      </div>

      <p class="section-label mt-2">Acciones</p>
      <HandButton button-id="btn-clear-canvas" variant="pink" :dwell-ms="600" class="tool-btn" @click="clearCanvas">
        🗑️ Borrar
      </HandButton>
      <HandButton button-id="btn-undo-drawing" variant="purple" :dwell-ms="600" class="tool-btn" @click="undo">
        ↩️ Deshacer
      </HandButton>
      <div class="flex-1" />
      <HandButton button-id="btn-back-drawing" variant="cyan" :dwell-ms="600" class="tool-btn" @click="goBack">
        🏠 Menú
      </HandButton>
    </aside>

    <!-- Instrucciones -->
    <div class="instructions glass">
      <div class="instr">☝️ Solo índice = <b>Dibujar</b></div>
      <div class="instr">✋ Mano abierta = <b>Pausa</b></div>
      <div class="instr">🤏 Pinza = <b>Cambiar color</b></div>
    </div>

    <!-- Estado -->
    <div class="state-badge" :class="{ drawing: isIndexUp && !isOpenHand, paused: isOpenHand }">
      <span v-if="isOpenHand">✋ Pausado</span>
      <span v-else-if="isIndexUp">☝️ Dibujando...</span>
      <span v-else-if="!isVisible">👋 Mueve tu mano</span>
      <span v-else>🖐️ Listo</span>
    </div>

    <Transition name="cel">
      <div v-if="showCelebration" class="celebration font-display text-8xl text-center flex flex-col items-center">
        <span>🎉</span>
        <span class="text-3xl mt-4 text-green-400 drop-shadow-lg">¡+15 Puntos!</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import HandButton from '@/components/HandButton.vue'
import { cursorX, cursorY, isVisible } from '@/composables/useHandCursor.js'
import { isIndexUp, isOpenHand, isPinching } from '@/composables/useGestures.js'
import { useScore } from '@/composables/useScore.js'

const router      = useRouter()
const drawCanvas  = ref(null)

const { addPoints } = useScore()
const selectedColor = ref('#7C3AED')
const brushSize     = ref(8)
const showCelebration = ref(false)

const colors = [
  {name:'purple', v:'#7C3AED'},{name:'cyan', v:'#06B6D4'},
  {name:'pink',   v:'#EC4899'},{name:'green', v:'#10B981'},
  {name:'orange', v:'#F97316'},{name:'yellow',v:'#F59E0B'},
  {name:'red',    v:'#EF4444'},{name:'white', v:'#FFFFFF'},
]

let ctx = null, isDrawing = false, lastX = 0, lastY = 0
let strokeCount = 0, history = []

onMounted(() => {
  const c = drawCanvas.value
  c.width = window.innerWidth; c.height = window.innerHeight
  ctx = c.getContext('2d')
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  saveSnap()
  window.addEventListener('resize', () => { c.width = window.innerWidth; c.height = window.innerHeight })
})

function saveSnap() {
  if (!ctx) return
  history.push(ctx.getImageData(0, 0, drawCanvas.value.width, drawCanvas.value.height))
  if (history.length > 20) history.shift()
}

function undo() {
  if (history.length <= 1) return
  history.pop()
  ctx.putImageData(history[history.length - 1], 0, 0)
}

function clearCanvas() {
  saveSnap(); ctx.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height); strokeCount = 0
}

watch([cursorX, cursorY, isIndexUp, isOpenHand], () => {
  if (!ctx || !isVisible.value) return
  const cx = cursorX.value, cy = cursorY.value
  if (isIndexUp.value && !isOpenHand.value) {
    if (!isDrawing) { isDrawing = true; ctx.beginPath(); ctx.moveTo(cx, cy); lastX = cx; lastY = cy; return }
    ctx.beginPath(); ctx.moveTo(lastX, lastY)
    const mx = (lastX + cx) / 2, my = (lastY + cy) / 2
    ctx.quadraticCurveTo(lastX, lastY, mx, my)
    ctx.strokeStyle = selectedColor.value; ctx.lineWidth = brushSize.value; ctx.stroke()
    lastX = cx; lastY = cy; strokeCount++
    if (strokeCount === 120) { 
      showCelebration.value = true
      addPoints(15) // Recompensa por dibujar
      setTimeout(() => showCelebration.value = false, 2000) 
    }
  } else {
    if (isDrawing) { isDrawing = false; saveSnap() }
  }
})

// El cambio de color por pinza ya no es necesario porque usamos HandButtons
// pero lo mantenemos como atajo opcional con un debounce extra
let lastPinch = false
let lastPinchTime = 0
watch(isPinching, (v) => {
  const now = Date.now()
  if (v && !lastPinch && now - lastPinchTime > 800) {
    const i = colors.findIndex(c => c.v === selectedColor.value)
    selectedColor.value = colors[(i + 1) % colors.length].v
    lastPinchTime = now
  }
  lastPinch = v
})

function goBack() { router.push('/menu') }
</script>

<style scoped>
.draw-canvas { position:absolute; inset:0; width:100%; height:100%; cursor:none; }
.toolbar {
  position:fixed; left:16px; top:50%; transform:translateY(-50%);
  width:140px; padding:16px 12px; border-radius:20px;
  display:flex; flex-direction:column; gap:10px; z-index:100;
}
.section-label { font-size:.7rem; font-weight:700; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.08em; }
.color-palette { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
.color-dot { width:28px!important; height:28px!important; min-width:0!important; padding:0!important; border-radius:50%!important; border:2px solid transparent; cursor:none; transition:transform .2s; }
.color-dot.selected, .color-dot:hover { transform:scale(1.3); border-color:white; }
.brush-btn { width:36px!important; height:36px!important; min-width:0!important; padding:0!important; border-radius:50%!important; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; cursor:none; }
.brush-btn.selected { background:rgba(124,58,237,.3); border-color:rgba(124,58,237,.6); }
.brush-dot { border-radius:50%; }
.tool-btn { width:100%; padding:10px 8px!important; font-size:.8rem!important; border-radius:12px!important; text-align:center; }
.instructions { position:fixed; right:16px; top:50%; transform:translateY(-50%); padding:14px 16px; border-radius:16px; z-index:100; display:flex; flex-direction:column; gap:10px; }
.instr { font-size:.82rem; color:rgba(255,255,255,.7); }
.state-badge { position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:8px 24px; border-radius:24px; background:rgba(10,10,26,.8); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.7); font-size:.9rem; font-weight:700; z-index:100; transition:all .3s; }
.state-badge.drawing { background:rgba(124,58,237,.3); border-color:rgba(124,58,237,.5); color:#DDD6FE; }
.state-badge.paused  { background:rgba(245,158,11,.2); border-color:rgba(245,158,11,.4); color:#FDE68A; }
.celebration { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:200; }
.cel-enter-active { animation:pop .4s ease-out; }
.cel-leave-active { transition:opacity .5s; }
.cel-leave-to     { opacity:0; }
</style>

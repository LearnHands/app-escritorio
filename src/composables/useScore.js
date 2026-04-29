import { ref, computed, watch } from 'vue'

const SCORE_KEY = 'edumotion_score'
const storedScore = localStorage.getItem(SCORE_KEY)

export const globalScore = ref(storedScore ? parseInt(storedScore, 10) : 0)

// El nivel se calcula en base al puntaje (ej: 100 puntos = 1 nivel)
export const globalLevel = computed(() => {
  return Math.floor(globalScore.value / 100) + 1
})

// Variables para animaciones en la UI
export const showScoreAnim = ref(false)
export const lastAddedScore = ref(0)
let animTimeout = null

export function addPoints(points) {
  if (points <= 0) return
  
  globalScore.value += points
  lastAddedScore.value = points
  
  // Guardar en localStorage
  localStorage.setItem(SCORE_KEY, globalScore.value.toString())
  
  // Disparar animación en la UI global
  showScoreAnim.value = true
  if (animTimeout) clearTimeout(animTimeout)
  animTimeout = setTimeout(() => {
    showScoreAnim.value = false
  }, 2000)
}

export function resetPoints() {
  globalScore.value = 0
  localStorage.setItem(SCORE_KEY, '0')
}

export function useScore() {
  return {
    score: globalScore,
    level: globalLevel,
    showScoreAnim,
    lastAddedScore,
    addPoints,
    resetPoints
  }
}

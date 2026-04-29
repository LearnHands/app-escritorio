import { ref, shallowRef } from 'vue'

// Estado global compartido entre composables
export const landmarks    = ref([])       // 21 puntos normalizados [0,1]
export const handedness   = ref(null)     // 'Left' | 'Right'
export const isDetecting  = ref(false)
export const handsReady   = ref(false)
export const mpError      = ref('')

let handsInstance = null
let cameraInstance = null

export function useMediaPipe() {

  async function initMediaPipe(videoElement, onResultsCallback) {
    if (!videoElement) return

    // Cargar MediaPipe dinámicamente inyectando el script oficial (evita conflictos de módulos CJS/ESM en Vite)
    if (!window.Hands) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js'
        script.crossOrigin = 'anonymous'
        script.onload = resolve
        script.onerror = () => reject(new Error('Fallo al cargar script de MediaPipe Hands'))
        document.head.appendChild(script)
      })
    }

    const Hands = window.Hands

    handsInstance = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      },
    })

    handsInstance.setOptions({
      maxNumHands:          1,
      modelComplexity:      1,
      minDetectionConfidence:  0.7,
      minTrackingConfidence:   0.7,
    })

    let frameCount = 0

    handsInstance.onResults((results) => {
      frameCount++
      if (frameCount % 60 === 0) console.log('[MediaPipe] onResults - landmarks:', results.multiHandLandmarks?.length)

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        landmarks.value   = results.multiHandLandmarks[0]
        handedness.value  = results.multiHandedness?.[0]?.label ?? null
        isDetecting.value = true
      } else {
        landmarks.value   = []
        isDetecting.value = false
      }

      if (onResultsCallback) onResultsCallback(results)
    })

    try {
      console.log('[MediaPipe] Inicializando modelos...')
      mpError.value = 'Descargando modelo...'
      await handsInstance.initialize()
      mpError.value = ''
      console.log('[MediaPipe] Modelos listos.')
    } catch (e) {
      console.error('[MediaPipe] Error al inicializar:', e)
      mpError.value = 'Error MediaPipe: ' + e.message
    }

    handsReady.value = true

    // Bucle nativo en lugar de camera_utils para no sobreescribir el stream
    let processCount = 0
    let isProcessing = false
    async function processVideo() {
      if (!handsReady.value) return

      if (videoElement.readyState >= 2 && !videoElement.paused && videoElement.videoWidth > 0 && !isProcessing) {
        isProcessing = true
        try {
          processCount++
          if (processCount === 1) console.log(`[MediaPipe] Enviando primer frame (${videoElement.videoWidth}x${videoElement.videoHeight})`)
          await handsInstance.send({ image: videoElement })
        } catch (err) {
          console.error('[MediaPipe] Error procesando frame:', err)
        }
        isProcessing = false
      }

      if (handsReady.value) {
        window.requestAnimationFrame(processVideo)
      }
    }

    // Iniciar loop
    processVideo()
  }

  function stopMediaPipe() {
    handsReady.value  = false
    isDetecting.value = false
    landmarks.value   = []
    if (handsInstance) {
      handsInstance.close()
      handsInstance = null
    }
  }

  return {
    landmarks,
    handedness,
    isDetecting,
    handsReady,
    mpError,
    initMediaPipe,
    stopMediaPipe,
  }
}

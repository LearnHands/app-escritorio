import { ref, onUnmounted } from 'vue'

// Exports globales del módulo (importables directamente)
export const stream   = ref(null)
export const isActive = ref(false)
export const hasError = ref(false)
export const errorMsg = ref('')

export function useCamera() {
  // Expone los refs globales también desde el composable

  async function startCamera(videoElement) {
    try {
      hasError.value = false
      errorMsg.value = ''

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:       { ideal: 1280 },
          height:      { ideal: 720 },
          facingMode:  'user',
          frameRate:   { ideal: 30 },
        },
        audio: false,
      })

      stream.value = mediaStream
      isActive.value = true

      if (videoElement) {
        videoElement.srcObject = mediaStream
        await videoElement.play()
      }

      return mediaStream
    } catch (err) {
      hasError.value = true
      errorMsg.value = err.message
      console.error('[EduMotion] Error de cámara:', err)
      throw err
    }
  }

  function stopCamera() {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value   = null
      isActive.value = false
    }
  }

  onUnmounted(() => {
    stopCamera()
  })

  return {
    stream,
    isActive,
    hasError,
    errorMsg,
    startCamera,
    stopCamera,
  }
}

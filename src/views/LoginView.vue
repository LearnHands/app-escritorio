<template>
  <div class="login-view w-full h-screen flex flex-col items-center justify-center p-6 relative">
    
    <!-- Decoración de fondo -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full"></div>
    </div>

    <!-- Contenedor del Login -->
    <main class="login-card glass z-10 w-full max-w-md p-10 flex flex-col items-center">
      <div class="text-6xl mb-4 animate-bounce-slow">🖐️</div>
      <h1 class="font-display text-3xl text-white mb-2">EduMotion</h1>
      <p class="text-sm text-white/60 mb-8 text-center">Acceso exclusivo para Docentes y Administradores</p>

      <form @submit.prevent="handleLogin" class="w-full flex flex-col gap-4">
        
        <div class="input-group">
          <label for="username" class="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Usuario</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="Ej. profesor"
            required
            class="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
          />
        </div>

        <div class="input-group">
          <label for="password" class="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="••••••••"
            required
            class="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
          />
        </div>

        <Transition name="fade">
          <div v-if="errorMessage" class="text-red-400 text-sm text-center font-bold mt-2 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
            {{ errorMessage }}
          </div>
        </Transition>

        <button 
          type="submit" 
          class="mt-6 w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
        >
          Iniciar Sesión
        </button>
      </form>
    </main>
    
    <footer class="mt-8 text-white/40 text-xs z-10">
      Fe y Alegría Ecuador &copy; 2024
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, initDB } from '@/services/db'

const router = useRouter()

const username = ref('')
const password = ref('')
const errorMessage = ref('')

onMounted(() => {
  // Inicializar DB en caso de ser la primera vez
  initDB()
})

function handleLogin() {
  errorMessage.value = ''
  
  if (!username.value || !password.value) {
    errorMessage.value = 'Por favor completa todos los campos'
    return
  }

  const user = login(username.value.trim(), password.value)
  if (user) {
    // Redirigir a Home
    router.push('/home')
  } else {
    errorMessage.value = 'Credenciales incorrectas. Verifica tu usuario y contraseña.'
  }
}
</script>

<style scoped>
.login-view {
  background: #0A0A1A;
}

.login-card {
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Importar vistas
import HomeView   from './views/HomeView.vue'
import MenuView   from './views/MenuView.vue'
import DrawingView from './views/DrawingView.vue'
import PianoView  from './views/PianoView.vue'
import PuzzleView from './views/PuzzleView.vue'
import LoginView  from './views/LoginView.vue'

// Router — usamos Hash history para compatibilidad con Electron
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',        name: 'login',   component: LoginView },
    { path: '/home',    name: 'home',    component: HomeView, meta: { requiresAuth: true } },
    { path: '/menu',    name: 'menu',    component: MenuView, meta: { requiresAuth: true } },
    { path: '/drawing', name: 'drawing', component: DrawingView, meta: { requiresAuth: true } },
    { path: '/piano',   name: 'piano',   component: PianoView, meta: { requiresAuth: true } },
    { path: '/puzzle',  name: 'puzzle',  component: PuzzleView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to, from, next) => {
  const session = sessionStorage.getItem('edumotion_session')
  if (to.meta.requiresAuth && !session) {
    next('/')
  } else if (to.path === '/' && session) {
    next('/home')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')

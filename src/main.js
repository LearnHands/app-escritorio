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

// Router — usamos Hash history para compatibilidad con Electron
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',        name: 'home',    component: HomeView },
    { path: '/menu',    name: 'menu',    component: MenuView },
    { path: '/drawing', name: 'drawing', component: DrawingView },
    { path: '/piano',   name: 'piano',   component: PianoView },
    { path: '/puzzle',  name: 'puzzle',  component: PuzzleView },
  ],
})

const app = createApp(App)
app.use(router)
app.mount('#app')

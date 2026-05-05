const DB_KEY = 'edumotion_db_users'

function seedDatabase() {
  const existing = localStorage.getItem(DB_KEY)
  if (!existing) {
    // Insertar usuarios por defecto si no existen
    const defaultUsers = [
      { id: 1, username: 'admin', password: '123', role: 'admin', name: 'Administrador Principal' },
      { id: 2, username: 'profesor', password: '123', role: 'teacher', name: 'Profesor Invitado' }
    ]
    localStorage.setItem(DB_KEY, JSON.stringify(defaultUsers))
  }
}

export function initDB() {
  seedDatabase()
}

export function login(username, password) {
  const usersStr = localStorage.getItem(DB_KEY) // Lista de usuarios persiste en localStorage
  if (!usersStr) return null
  
  const users = JSON.parse(usersStr)
  const user = users.find(u => u.username === username && u.password === password)
  
  if (user) {
    // La SESIÓN se guarda en sessionStorage para que se pierda al cerrar la ventana/app
    const { password: _, ...userInfo } = user
    sessionStorage.setItem('edumotion_session', JSON.stringify(userInfo))
    return userInfo
  }
  return null
}

export function logout() {
  sessionStorage.removeItem('edumotion_session')
}

export function getCurrentUser() {
  const sessionStr = sessionStorage.getItem('edumotion_session')
  return sessionStr ? JSON.parse(sessionStr) : null
}

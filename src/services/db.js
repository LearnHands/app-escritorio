const DB_KEY = 'learnhands_users';
const SESSION_KEY = 'learnhands_session';

function seedDatabase() {
  const existing = localStorage.getItem(DB_KEY);
  if (!existing) {
    const defaultUsers = [
      { id: 1, username: 'admin',    password: '123', role: 'admin',   name: 'Administrador Principal' },
      { id: 2, username: 'profesor', password: '123', role: 'teacher', name: 'Profesor Invitado' }
    ];
    localStorage.setItem(DB_KEY, JSON.stringify(defaultUsers));
  }
}

export function initDB() {
  seedDatabase();
}

export function login(username, password) {
  const usersStr = localStorage.getItem(DB_KEY);
  if (!usersStr) return null;

  const users = JSON.parse(usersStr);
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const { password: _, ...userInfo } = user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userInfo));
    return userInfo;
  }
  return null;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  const sessionStr = sessionStorage.getItem(SESSION_KEY);
  return sessionStr ? JSON.parse(sessionStr) : null;
}

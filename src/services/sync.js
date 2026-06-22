const METRICS_QUEUE_KEY = 'learnhands_metrics_queue';
const LOCAL_LOGS_KEY = 'learnhands_local_logs';
const CONFIG_KEY = 'learnhands_config';

const DEFAULT_API_URL = 'https://autocomerciojvc.com';

export function getApiUrl() {
  const config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
  return config.apiUrl || DEFAULT_API_URL;
}

export function setApiUrl(url) {
  const config = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
  config.apiUrl = url;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  addLocalLog('SYSTEM_CONFIG', `URL de la API cambiada a: ${url}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Lógica de Logs de Auditoría Locales
// ─────────────────────────────────────────────────────────────────────────────

export function getLocalLogs() {
  return JSON.parse(localStorage.getItem(LOCAL_LOGS_KEY) || '[]');
}

export function addLocalLog(action, details) {
  const logs = getLocalLogs();
  const newLog = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    action,
    details,
    created_at: new Date().toISOString()
  };
  
  // Limitar a los últimos 500 logs locales para no saturar localStorage
  logs.unshift(newLog);
  if (logs.length > 500) {
    logs.pop();
  }
  
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
  console.log(`[Audit Log Local] [${action}] ${details}`);
  return newLog;
}

export function clearLocalLogs() {
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify([]));
  addLocalLog('SYSTEM_LOGS_CLEAR', 'Se han limpiado los logs locales de auditoría.');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Lógica de Cola de Métricas (Offline-First)
// ─────────────────────────────────────────────────────────────────────────────

export function getMetricsQueue() {
  return JSON.parse(localStorage.getItem(METRICS_QUEUE_KEY) || '[]');
}

export function getMetricsHistory() {
  try {
    return JSON.parse(localStorage.getItem('learnhands_metrics_history') || '[]');
  } catch (e) {
    return [];
  }
}

export function seedMetricsHistory() {
  const historyKey = 'learnhands_metrics_history';
  const existing = localStorage.getItem(historyKey);
  if (!existing || JSON.parse(existing).length < 5) {
    const students = ['Juan', 'Maria', 'Pedro', 'KathePastaz', 'Luis', 'Sofia'];
    const games = ['PIZARRA', 'PIANO', 'ROMPECABEZAS', 'ANATOMIA', 'CONTABILIDAD', 'CIRCUITOS', 'CODING', 'INGLES', 'VERBOS'];
    const seeded = [];
    const now = new Date();
    
    for (let i = 0; i < 60; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const game = games[Math.floor(Math.random() * games.length)];
      const score = Math.floor(Math.random() * 400) + 50;
      const duration = Math.floor(Math.random() * 180) + 40; // 40s to 220s
      // distribute over the last 10 days
      const date = new Date(now.getTime() - Math.floor(Math.random() * 10 * 24 * 3600 * 1000));
      
      seeded.push({
        id: 'h_' + date.getTime() + '_' + Math.random().toString(36).substr(2, 5),
        username: student,
        game_name: game,
        score,
        duration_seconds: duration,
        played_at: date.toISOString()
      });
    }
    // Sort by date ascending
    seeded.sort((a, b) => new Date(a.played_at) - new Date(b.played_at));
    localStorage.setItem(historyKey, JSON.stringify(seeded));
  }
}

export function addGameMetric(username, gameName, score, durationSeconds) {
  const queue = getMetricsQueue();
  const newMetric = {
    id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    username,
    game_name: gameName,
    score,
    duration_seconds: durationSeconds,
    played_at: new Date().toISOString()
  };

  queue.push(newMetric);
  localStorage.setItem(METRICS_QUEUE_KEY, JSON.stringify(queue));
  
  // Guardar en el historial local permanente
  try {
    const historyKey = 'learnhands_metrics_history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({ ...newMetric, id: 'h_' + newMetric.id });
    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch (e) {
    console.error('[Sync] Error saving to local history:', e);
  }
  
  addLocalLog(
    'GAME_METRIC_SAVED', 
    `Métrica de juego guardada localmente: ${gameName} por ${username}. Puntaje: ${score}, Duración: ${durationSeconds}s`
  );

  // Intentar sincronizar inmediatamente al registrar
  triggerSync();
  
  return newMetric;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Proceso de Sincronización
// ─────────────────────────────────────────────────────────────────────────────

let isSyncing = false;

export async function triggerSync() {
  if (isSyncing) return { status: 'syncing', message: 'Sincronización ya en curso.' };
  
  const queue = getMetricsQueue();
  if (queue.length === 0) {
    return { status: 'empty', message: 'No hay métricas pendientes de sincronizar.' };
  }

  if (!navigator.onLine) {
    console.log('[Sync] El navegador se encuentra Offline. Sincronización pospuesta.');
    return { status: 'offline', message: 'Sin conexión a internet.' };
  }

  isSyncing = true;
  const apiUrl = getApiUrl();
  console.log(`[Sync] Iniciando envío de ${queue.length} métricas pendientes a ${apiUrl}...`);

  try {
    const response = await fetch(`${apiUrl}/api/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queue)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error del servidor (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Limpiar de la cola local solo lo que enviamos exitosamente
    localStorage.setItem(METRICS_QUEUE_KEY, JSON.stringify([]));
    
    addLocalLog(
      'SYNC_SUCCESS', 
      `Sincronización exitosa. ${queue.length} métrica(s) enviada(s) correctamente a la base de datos.`
    );
    
    isSyncing = false;
    
    // Disparar evento global por si componentes quieren actualizar UI
    window.dispatchEvent(new CustomEvent('learnhands_sync_completed', { detail: result }));
    
    return { status: 'success', count: queue.length, result };

  } catch (error) {
    isSyncing = false;
    console.error('[Sync] Error en el proceso de sincronización:', error.message);
    
    addLocalLog(
      'SYNC_FAILED', 
      `Fallo en el intento de sincronización de ${queue.length} métricas. Detalle: ${error.message}`
    );
    
    window.dispatchEvent(new CustomEvent('learnhands_sync_failed', { detail: error.message }));
    
    return { status: 'failed', error: error.message };
  }
}

// Registros de alumnos pendientes (guardados cuando no hay conexión)
const PENDING_REGISTRATIONS_KEY = 'learnhands_pending_registrations';

export async function flushPendingRegistrations() {
  const pending = JSON.parse(localStorage.getItem(PENDING_REGISTRATIONS_KEY) || '[]');
  if (pending.length === 0) return;
  if (!navigator.onLine) return;

  const apiUrl = getApiUrl();
  const succeeded = [];

  for (const reg of pending) {
    try {
      const resp = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reg)
      });
      if (resp.ok) {
        succeeded.push(reg.username);
      }
    } catch (e) {
      // Aun sin conexión, lo reintentaremos la próxima vez
    }
  }

  if (succeeded.length > 0) {
    const remaining = pending.filter(p => !succeeded.includes(p.username));
    localStorage.setItem(PENDING_REGISTRATIONS_KEY, JSON.stringify(remaining));
    addLocalLog('PENDING_REGISTRATIONS_FLUSHED', `${succeeded.length} registro(s) de alumno pendiente(s) enviado(s): ${succeeded.join(', ')}`);
  }
}

// Escuchas del sistema de red para sincronizar automáticamente al conectarse a internet
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    addLocalLog('NETWORK_STATUS', 'El dispositivo ha recuperado la conexión a internet.');
    triggerSync();
    flushPendingRegistrations();
  });

  window.addEventListener('offline', () => {
    addLocalLog('NETWORK_STATUS', 'El dispositivo ha perdido la conexión a internet (Modo Offline activo).');
  });

  // Intentar sincronizar al arrancar la app
  setTimeout(triggerSync, 5000);
  setTimeout(flushPendingRegistrations, 6000);
}

export default {
  getApiUrl,
  setApiUrl,
  getLocalLogs,
  addLocalLog,
  clearLocalLogs,
  getMetricsQueue,
  addGameMetric,
  triggerSync,
  getMetricsHistory,
  seedMetricsHistory
};

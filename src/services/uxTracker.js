import { getApiUrl } from './sync';

const UX_QUEUE_KEY = 'learnhands_ux_queue';

export function getUxQueue() {
  try {
    return JSON.parse(localStorage.getItem(UX_QUEUE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function getUxHistory() {
  try {
    return JSON.parse(localStorage.getItem('learnhands_ux_history') || '[]');
  } catch (e) {
    return [];
  }
}

export function seedUxHistory() {
  const historyKey = 'learnhands_ux_history';
  const existing = localStorage.getItem(historyKey);
  if (!existing || JSON.parse(existing).length < 5) {
    const students = ['Juan', 'Maria', 'Pedro', 'KathePastaz', 'Luis', 'Sofia'];
    const games = ['PIZARRA', 'PIANO', 'ROMPECABEZAS', 'ANATOMIA', 'CONTABILIDAD', 'CIRCUITOS', 'CODING', 'INGLES', 'VERBOS'];
    const metricTypes = ['SESSION_TIME', 'AUTONOMY_TIME', 'RECOGNITION_ACCURACY', 'ACTIVE_MODULE'];
    const seeded = [];
    const now = new Date();

    for (let i = 0; i < 80; i++) {
      const student = students[Math.floor(Math.random() * students.length)];
      const game = games[Math.floor(Math.random() * games.length)];
      const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)];
      let value = 0;
      let details = {};

      if (metricType === 'SESSION_TIME') {
        value = Math.floor(Math.random() * 20) + 5; // 5 to 25 mins
        details = { note: 'Active usage session' };
      } else if (metricType === 'AUTONOMY_TIME') {
        value = Math.floor(Math.random() * 15) + 2; // 2 to 17 mins
        details = { note: 'Independent learning without help' };
      } else if (metricType === 'RECOGNITION_ACCURACY') {
        value = Math.floor(Math.random() * 20) + 80; // 80% to 100%
        details = { errors: Math.floor(Math.random() * 5), total_gestures: 100 };
      } else {
        value = 1; // 1 open
        details = { module: game };
      }

      const date = new Date(now.getTime() - Math.floor(Math.random() * 10 * 24 * 3600 * 1000));

      seeded.push({
        id: 'uxh_' + date.getTime() + '_' + Math.random().toString(36).substr(2, 5),
        username: student,
        metric_type: metricType,
        game_name: game,
        metric_value: value,
        details: JSON.stringify(details),
        played_at: date.toISOString()
      });
    }

    seeded.sort((a, b) => new Date(a.played_at) - new Date(b.played_at));
    localStorage.setItem(historyKey, JSON.stringify(seeded));
  }
}

export function addUxMetric(username, metricType, gameName, metricValue, details = {}) {
  if (!username) {
    username = localStorage.getItem('learnhands_session_user') || 'Anonimo';
  }
  
  const queue = getUxQueue();
  const newMetric = {
    id: 'ux_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    username,
    metric_type: metricType,
    game_name: gameName,
    metric_value: parseFloat(metricValue),
    details: typeof details === 'string' ? details : JSON.stringify(details),
    played_at: new Date().toISOString()
  };

  queue.push(newMetric);
  localStorage.setItem(UX_QUEUE_KEY, JSON.stringify(queue));
  
  // Guardar en el historial local permanente
  try {
    const historyKey = 'learnhands_ux_history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({ ...newMetric, id: 'uxh_' + newMetric.id });
    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch (e) {
    console.error('[UX Tracker] Error saving to local history:', e);
  }

  console.log(`[UX Tracker] [${metricType}] ${gameName}: ${metricValue}`, details);

  // Attempt sync immediately
  triggerUxSync();
  
  return newMetric;
}

let isSyncingUx = false;

export async function triggerUxSync() {
  if (isSyncingUx) return { status: 'syncing' };
  
  const queue = getUxQueue();
  if (queue.length === 0) {
    return { status: 'empty' };
  }

  if (!navigator.onLine) {
    return { status: 'offline' };
  }

  isSyncingUx = true;
  const apiUrl = getApiUrl();

  try {
    const response = await fetch(`${apiUrl}/api/ux-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queue)
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Success, clear local queue
    localStorage.setItem(UX_QUEUE_KEY, JSON.stringify([]));
    isSyncingUx = false;
    return { status: 'success' };
  } catch (error) {
    isSyncingUx = false;
    console.error('[UX Sync] Failed to sync UX metrics:', error.message);
    return { status: 'failed', error: error.message };
  }
}

// Auto-sync when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    triggerUxSync();
  });
  
  // Try sync on startup
  setTimeout(triggerUxSync, 6000);
}

export default {
  getUxQueue,
  addUxMetric,
  triggerUxSync,
  getUxHistory,
  seedUxHistory
};

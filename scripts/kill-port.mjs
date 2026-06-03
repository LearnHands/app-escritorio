/**
 * kill-port.mjs — frees a TCP port before dev server starts
 * Usage: node scripts/kill-port.mjs 5173
 */
import { execSync } from 'child_process';

const port = process.argv[2] || '5173';

try {
  if (process.platform === 'win32') {
    // Find PID listening on the port, then kill it
    const out = execSync(`netstat -ano`, { encoding: 'utf8' });
    const lines = out.split('\n').filter(l => l.includes(`:${port} `) && l.includes('LISTENING'));
    const pids  = [...new Set(lines.map(l => l.trim().split(/\s+/).pop()).filter(Boolean))];
    if (pids.length) {
      pids.forEach(pid => {
        try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch {}
      });
      console.log(`[kill-port] freed port ${port} (PID${pids.length > 1 ? 's' : ''}: ${pids.join(', ')})`);
    } else {
      console.log(`[kill-port] port ${port} already free`);
    }
  } else {
    // macOS / Linux
    try {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
      console.log(`[kill-port] freed port ${port}`);
    } catch {
      console.log(`[kill-port] port ${port} already free`);
    }
  }
} catch (e) {
  console.warn(`[kill-port] warning: ${e.message}`);
}

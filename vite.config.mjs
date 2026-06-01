import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },

  base: './',

  // ── Build optimisations ────────────────────────────────────────────────────
  build: {
    outDir:    'dist',
    assetsDir: 'assets',

    // Electron 28 → Chromium 120+: target ESNext removes all legacy polyfills
    target: 'esnext',

    // Minify with esbuild (fast + good compression; terser not needed here)
    minify: 'esbuild',

    // Remove console.log in production; keep console.warn/error for real issues
    esbuild: { drop: ['debugger'], pure: ['console.log'] },

    // Raise warning threshold so CI isn't noisy (vendors legitimately exceed 500 kB)
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        // ── Vendor splitting ───────────────────────────────────────────────
        // Each vendor chunk is loaded once and cached; game modules load
        // independently via React.lazy so only the active game's code is
        // parsed by V8 on first visit.
        manualChunks(id) {
          // React core — tiny, but keep isolated for browser-cache friendliness
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          // Framer Motion — largest vendor (~120 kB min); single shared chunk
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          // Lucide icons — tree-shaken already, but isolate for caching
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide'
          }
          // All other node_modules in one vendor catch-all
          if (id.includes('node_modules/')) {
            return 'vendor-misc'
          }
          // Each game module gets its own async chunk (loaded by React.lazy)
          // Vite handles this automatically via dynamic import(); no manual
          // entry needed here — rollup detects them as separate entry points.
        },

        // Predictable, content-addressed filenames (good for Electron's file cache)
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
      },
    },
  },

  // ── Dev server ─────────────────────────────────────────────────────────────
  server: {
    port: 5173,
    strictPort: true,
  },

  // Exclude MediaPipe from Vite's pre-bundling (it loads its own WASM at runtime)
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
})

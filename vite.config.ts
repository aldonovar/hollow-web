import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@hollowbits/core': path.resolve(__dirname, 'src/hollowbits-core/index.ts'),
    },
  },

  // ── Dev server: enable cross-origin isolation locally ────
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  build: {
    // The ML kernel (basic-pitch) is ~1.8MB minified — expected
    chunkSizeWarningLimit: 2000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Heavy ML / WASM modules ──
          if (id.includes('@spotify/basic-pitch') || id.includes('register_all_kernels')) {
            return 'ml-kernels'
          }
          // ── Core vendor: React ecosystem ──
          if (id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor-react'
          }
          // ── Platform vendor: Supabase + auth ──
          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }
          // ── Animation vendor ──
          if (id.includes('gsap') || id.includes('lenis')) {
            return 'vendor-animation'
          }
          // ── AI / GenAI SDK ──
          if (id.includes('@google/genai')) {
            return 'vendor-ai'
          }
        },
      },
    },
  },
})

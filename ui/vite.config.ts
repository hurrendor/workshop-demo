import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const buildId =
  process.env.RENDER_GIT_COMMIT?.slice(0, 7) ??
  process.env.VITE_BUILD_ID ??
  'dev'

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})

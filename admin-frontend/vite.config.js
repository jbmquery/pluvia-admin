import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El proxy hace que el navegador vea frontend y API como el mismo origen:
// la cookie httpOnly viaja sin problemas de CORS/SameSite en desarrollo.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5010', changeOrigin: true },
    },
  },
})

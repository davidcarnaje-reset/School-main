import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts: [
      '.ngrok-free.dev' // Para hindi harangin ni Vite ang ngrok
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1', // Nakaturo sa XAMPP
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/sms-api') 
      }
    }
  }
})
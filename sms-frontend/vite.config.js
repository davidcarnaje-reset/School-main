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
      '.ngrok-free.dev' // Ligtas pa rin ang ngrok tunnel mo
    ],
    proxy: {
      '/api': {
        // 🚀 DYNAMIC PORT ALIGNMENT: Direkta nang nakaturo sa Node.js Engine mo!
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Alisin na natin ang rewrite para hindi na niya hanapin si /sms-api
        rewrite: (path) => path
      }
    }
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network interfaces
    allowedHosts: true, // Allow ngrok URLs
    // REMOVE the "hmr" section that had clientPort: 443
  },
})
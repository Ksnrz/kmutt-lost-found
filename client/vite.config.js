import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // fetch('/api/...') from the client goes to the Express server
  server: { proxy: { '/api': 'http://localhost:3000' } },
})

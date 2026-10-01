import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative assets work at /pp/ and on any ordinary static file host.
  base: './',
})

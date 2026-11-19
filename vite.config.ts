import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Everything under `public` is part of the game and is shipped as it is. The contest build that runs from disk
// reuses this configuration with its own output folder and format (scripts/build-submission.mjs).
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: 'dist' },
})

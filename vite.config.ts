import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// List actual public assets at build time; no manifest dependency or duplicate imports.
const imageDirectory = fileURLToPath(new URL('./public/assets/images/', import.meta.url))
const imageFiles = readdirSync(imageDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b))

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: { __GALLERY_FILES__: JSON.stringify(imageFiles) },
  build: { outDir: 'dist' },
})

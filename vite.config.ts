import { existsSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// List actual public assets at build time; no manifest dependency or duplicate imports.
const imageDirectory = fileURLToPath(new URL('./public/assets/images/', import.meta.url))
const imageFiles = readdirSync(imageDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b))

// The published game never requests these: the first game's originals and derivatives (the asset gallery is
// development-only) and a 5 MB PNG whose WebP copy is the one in use. The source files in `public` stay untouched.
// Effects that the game plays from a trimmed copy (src/center/audio.ts SFX_TRIMMED): their delivered originals stay in `public` but are not shipped.
// Read from the folder of trimmed copies so the list cannot drift; a test keeps that folder equal to SFX_TRIMMED.
const trimmedEffects = readdirSync(fileURLToPath(new URL('./public/center/audio-trimmed/', import.meta.url))).filter((name) => /^sfx_.*\.wav$/.test(name))
const unusedInBuild = ['assets/images', 'assets/game', 'assets/audio', 'center/official/nareumi-dari-3d.png', ...trimmedEffects.map((name) => `center/audio/${name}`)]
function pruneUnusedPublicFiles(): Plugin {
  return {
    name: 'prune-unused-public-files',
    apply: 'build',
    closeBundle() {
      for (const entry of unusedInBuild) {
        const target = fileURLToPath(new URL('./dist/' + entry, import.meta.url))
        if (existsSync(target)) rmSync(target, { recursive: true, force: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), pruneUnusedPublicFiles()],
  base: '/',
  define: { __GALLERY_FILES__: JSON.stringify(imageFiles) },
  build: { outDir: 'dist' },
})

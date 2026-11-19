import { existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
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
// development-only) and its page icon (this game's icon is center/favicon.svg). The source files in `public` stay untouched.
const unusedInBuild = ['assets/images', 'assets/game', 'assets/audio', 'favicon.svg']
function pruneUnusedPublicFiles(): Plugin {
  // The output folder is read from the resolved configuration: the contest build (scripts/build-submission.mjs) writes elsewhere.
  let outDir = fileURLToPath(new URL('./dist/', import.meta.url))
  return {
    name: 'prune-unused-public-files',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    closeBundle() {
      for (const entry of unusedInBuild) {
        const target = resolve(outDir, entry)
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

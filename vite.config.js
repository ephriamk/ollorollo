import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
function writeSongManifest(root) {
  try {
    const folder = path.resolve(root, 'public/song')
    if (!fs.existsSync(folder)) return
    const files = fs
      .readdirSync(folder, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .filter((name) => /\.(mp3|ogg|wav)$/i.test(name))
      .sort((a, b) => a.localeCompare(b))
    const outPath = path.resolve(folder, 'index.json')
    fs.writeFileSync(outPath, JSON.stringify(files, null, 2))
  } catch {
    // ignore
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'song-manifest',
      apply: 'serve',
      configResolved(config) {
        this._root = config.root
      },
      configureServer(server) {
        const root = this._root || server.config.root
        const folder = path.resolve(root, 'public/song')
        writeSongManifest(root)
        try {
          server.watcher.add(folder)
          server.watcher.on('add', (file) => {
            if (file.startsWith(folder)) writeSongManifest(root)
          })
          server.watcher.on('unlink', (file) => {
            if (file.startsWith(folder)) writeSongManifest(root)
          })
          server.watcher.on('change', (file) => {
            if (file.startsWith(folder)) writeSongManifest(root)
          })
        } catch {}
      },
    },
    {
      name: 'song-manifest-build',
      apply: 'build',
      configResolved(config) {
        this._root = config.root
      },
      buildStart() {
        writeSongManifest(this._root || process.cwd())
      },
      closeBundle() {
        writeSongManifest(this._root || process.cwd())
      },
    },
  ],
})

// Rasterizes public/icon.svg into the PNG sizes iOS / the web app manifest want.
// Run: node scripts/gen-icons.mjs   (requires the `sharp` devDependency)
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'public', 'icon.svg')
const out = (name) => path.join(root, 'public', name)

const targets = [
  // iOS "Add to Home Screen" icons
  ['apple-touch-icon.png', 180],
  ['apple-touch-icon-167x167.png', 167],
  ['apple-touch-icon-152x152.png', 152],
  ['apple-touch-icon-120x120.png', 120],
  // Web App Manifest icons (PNG fallbacks alongside the SVG)
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['maskable-512x512.png', 512],
  // App Store / Play Store: the 1024×1024 master icon (Xcode & Play Console both want this)
  ['icon-1024.png', 1024],
  // Favicon fallback
  ['favicon-32x32.png', 32],
]

for (const [name, size] of targets) {
  await sharp(src, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(out(name))
  console.log(`✓ ${name}  ${size}×${size}`)
}

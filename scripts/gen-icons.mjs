// Rasterizes public/icon.svg into the PNG sizes the web app manifest / iOS / Android need,
// and writes the iOS app-icon asset (Capacitor's single-size AppIcon.appiconset).
// Run: node scripts/gen-icons.mjs   (requires the `sharp` devDependency)
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'public', 'icon.svg')
const out = (name) => path.join(root, 'public', name)
const BG = '#0b0d12' // the app's dark background — used to flatten the iOS icon (no alpha allowed)

const targets = [
  // iOS "Add to Home Screen" icons (web/PWA — alpha is fine here)
  ['apple-touch-icon.png', 180],
  ['apple-touch-icon-167x167.png', 167],
  ['apple-touch-icon-152x152.png', 152],
  ['apple-touch-icon-120x120.png', 120],
  // Web App Manifest icons (PNG fallbacks alongside the SVG)
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['maskable-512x512.png', 512],
  // App Store / Play Store: the 1024×1024 master icon
  ['icon-1024.png', 1024],
  // Favicon fallback
  ['favicon-32x32.png', 32],
]

for (const [name, size] of targets) {
  await sharp(src, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(out(name))
  console.log(`✓ public/${name}  ${size}×${size}`)
}

// iOS app icon: Capacitor scaffolds a single-size AppIcon.appiconset (Contents.json points at
// AppIcon-512@2x.png, 1024×1024, idiom "universal"); Xcode generates the rest at build time.
// App Store Connect rejects icons with an alpha channel, so flatten onto the dark background.
const iosAppIcon = path.join(
  root,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'AppIcon.appiconset',
  'AppIcon-512@2x.png'
)
await mkdir(path.dirname(iosAppIcon), { recursive: true })
await sharp(src, { density: 384 })
  .resize(1024, 1024, { fit: 'cover' })
  .flatten({ background: BG })
  .png({ compressionLevel: 9 })
  .toFile(iosAppIcon)
console.log('✓ ios AppIcon.appiconset/AppIcon-512@2x.png  1024×1024 (opaque)')

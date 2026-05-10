// Generates the Android launcher icons from public/icon.svg into android/app/src/main/res/mipmap-*dpi/.
// (Capacitor's adaptive-icon XML already references @mipmap/ic_launcher_foreground + @color/ic_launcher_background,
// and values/ic_launcher_background.xml is set to #FF0B0D12.) Run: node scripts/gen-android-icons.mjs
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'public', 'icon.svg')
const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res')
const BG = '#0b0d12'

// dpi name → scale factor (mdpi = 1×)
const DENSITIES = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
]

const circleMask = (n) =>
  Buffer.from(`<svg width="${n}" height="${n}" xmlns="http://www.w3.org/2000/svg"><circle cx="${n / 2}" cy="${n / 2}" r="${n / 2}" fill="#fff"/></svg>`)

for (const [dpi, s] of DENSITIES) {
  const legacy = Math.round(48 * s) // ic_launcher.png / ic_launcher_round.png
  const fg = Math.round(108 * s) // ic_launcher_foreground.png (adaptive layer)
  const out = (name) => path.join(resDir, `mipmap-${dpi}`, name)

  // Adaptive foreground — full icon (chevron sits inside the central safe zone), opaque.
  await sharp(src, { density: 512 }).resize(fg, fg).flatten({ background: BG }).png({ compressionLevel: 9 }).toFile(out('ic_launcher_foreground.png'))
  // Legacy square icon.
  await sharp(src, { density: 512 }).resize(legacy, legacy).flatten({ background: BG }).png({ compressionLevel: 9 }).toFile(out('ic_launcher.png'))
  // Legacy round icon — clipped to a circle (transparent corners).
  await sharp(src, { density: 512 }).resize(legacy, legacy).composite([{ input: circleMask(legacy), blend: 'dest-in' }]).png({ compressionLevel: 9 }).toFile(out('ic_launcher_round.png'))

  console.log(`✓ mipmap-${dpi}: ic_launcher.png (${legacy}), ic_launcher_round.png (${legacy}), ic_launcher_foreground.png (${fg})`)
}
console.log('Done — adaptive background colour lives in res/values/ic_launcher_background.xml')

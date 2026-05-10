// Generates the 1024×500 Google Play "feature graphic".
// Usage:  node scripts/gen-feature-graphic.mjs   (needs the `sharp` devDependency)
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const W = 1024
const H = 500

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e6c882"/><stop offset="1" stop-color="#b89454"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.27" cy="0.55" r="0.6">
      <stop offset="0" stop-color="#b89454" stop-opacity="0.32"/><stop offset="1" stop-color="#b89454" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0b0d12"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <!-- the app's chevron mark (0–512 coords), scaled & placed on the left -->
  <g transform="translate(45,30) scale(0.82)">
    <g fill="none" stroke="url(#gold)" stroke-linecap="round" stroke-linejoin="round" stroke-width="42">
      <path d="M132 332 L256 206 L380 332"/>
      <path d="M164 412 L256 318 L348 412"/>
    </g>
    <circle cx="256" cy="138" r="24" fill="url(#gold)"/>
  </g>
  <!-- wordmark + tagline (Georgia / Arial are near-universal; falls back to generics) -->
  <text x="500" y="262" font-family="Georgia, 'Times New Roman', serif" font-size="130" font-weight="700"
        fill="#e6c882" letter-spacing="16">RYSE</text>
  <text x="503" y="318" font-family="Arial, Helvetica, sans-serif" font-size="27"
        fill="#9aa6b5" letter-spacing="2.5">Real life is the longest game.</text>
</svg>`

await mkdir(path.join(root, 'screenshots'), { recursive: true })
const out = path.join(root, 'screenshots', 'play-feature-graphic.png')
await sharp(Buffer.from(svg), { density: 300 }).resize(W, H).png({ compressionLevel: 9 }).toFile(out)
console.log(`✓ screenshots/play-feature-graphic.png  ${W}×${H}`)

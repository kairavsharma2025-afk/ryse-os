// Adds a caption + brand background to each raw screenshot in screenshots/{ios-6.7,ipad-13,android-phone}/,
// keeping the exact store dimensions. Output goes to screenshots/store/<viewport>/.
// Run: node scripts/gen-store-overlays.mjs   (requires the `sharp` devDependency)
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readdir, mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const shotsDir = path.join(root, 'screenshots')

const CAPTIONS = {
  '01-today': 'Your day, planned for you',
  '02-goals': 'Goals as quests you finish',
  '03-schedule': 'Block your week',
  '04-season': 'Seasons. Bosses. Rewards.',
  '05-reminders': 'Reminders that know you',
  '06-profile': 'Level up. Make it yours.',
  '07-achievements': 'Unlock the legendary',
  '08-ritual': 'A daily ritual',
}
const VIEWPORTS = ['ios-6.7', 'ipad-13', 'android-phone']

const escapeXml = (s) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])

async function overlay(srcPath, caption, dstPath) {
  const meta = await sharp(srcPath).metadata()
  const W = meta.width
  const H = meta.height
  const captionH = Math.round(H * 0.155)
  const shotH = Math.round(H * 0.78)
  const shotW = Math.round(shotH * (W / H)) // == 0.78 * W
  const shotX = Math.round((W - shotW) / 2)
  const shotY = captionH + Math.round((H - captionH - shotH) / 2)
  const radius = Math.round(shotW * 0.055)
  const fontSize = Math.round(W / 22)

  // round the screenshot's corners
  const maskSvg = `<svg width="${shotW}" height="${shotH}" xmlns="http://www.w3.org/2000/svg"><rect width="${shotW}" height="${shotH}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
  const roundedShot = await sharp(srcPath)
    .resize(shotW, shotH)
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer()

  // brand background + caption + a thin gold underline + a faint frame around the shot
  const bgSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#14181f"/><stop offset="0.45" stop-color="#0d1016"/><stop offset="1" stop-color="#0b0d12"/>
      </linearGradient>
      <radialGradient id="halo" cx="0.5" cy="0.085" r="0.7">
        <stop offset="0" stop-color="#b89454" stop-opacity="0.18"/><stop offset="1" stop-color="#b89454" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#halo)"/>
    <text x="${W / 2}" y="${Math.round(captionH * 0.6)}" text-anchor="middle"
          font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${fontSize}" fill="#ecdcb6">${escapeXml(caption)}</text>
    <rect x="${Math.round(W / 2 - W * 0.06)}" y="${Math.round(captionH * 0.79)}" width="${Math.round(W * 0.12)}" height="${Math.max(2, Math.round(W / 360))}" rx="2" fill="#b89454"/>
    <rect x="${shotX}" y="${shotY}" width="${shotW}" height="${shotH}" rx="${radius}" ry="${radius}" fill="none" stroke="#b89454" stroke-opacity="0.22" stroke-width="2"/>
  </svg>`

  await sharp(Buffer.from(bgSvg))
    .composite([{ input: roundedShot, left: shotX, top: shotY }])
    .png({ compressionLevel: 9 })
    .toFile(dstPath)
}

for (const vp of VIEWPORTS) {
  const inDir = path.join(shotsDir, vp)
  let files
  try {
    files = (await readdir(inDir)).filter((f) => f.endsWith('.png'))
  } catch {
    console.log(`(skipping ${vp} — no raw screenshots)`)
    continue
  }
  const outDir = path.join(shotsDir, 'store', vp)
  await mkdir(outDir, { recursive: true })
  for (const f of files) {
    const key = f.replace(/\.png$/, '')
    const caption = CAPTIONS[key] ?? key
    await overlay(path.join(inDir, f), caption, path.join(outDir, f))
    console.log(`✓ store/${vp}/${f}  "${caption}"`)
  }
}
console.log('\nDone — captioned screenshots are in screenshots/store/')

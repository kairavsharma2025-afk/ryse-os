import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.ryse',
  appName: 'Ryse',
  // Built web assets — `npm run build` writes here, then `npx cap sync` copies them in.
  webDir: 'dist',
  backgroundColor: '#0b0d12',
  // Serve the bundled app over https://localhost on Android (avoids mixed-content / cookie quirks).
  server: {
    androidScheme: 'https',
  },
  // To develop against the live site instead of the bundled assets, temporarily set:
  //   server: { url: 'https://ryse-os.vercel.app', cleartext: false }
}

export default config

import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

// Privacy-policy contact. Both Google Play and the App Store require a working
// address here — swap it for whatever inbox you want bots/users to reach.
const CONTACT_EMAIL = 'kairavs270207@gmail.com'

const LAST_UPDATED = 'May 10, 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="font-display text-lg tracking-wide mb-2">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-2">{children}</div>
    </Card>
  )
}

export function Privacy() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl tracking-wide">Privacy Policy</h1>
        <p className="text-xs text-muted mt-1">Last updated: {LAST_UPDATED}</p>
      </div>

      <Section title="The short version">
        <p>
          Ryse runs entirely on your device. There are no accounts, no Ryse servers, no analytics,
          no ads, and no tracking. Everything you create — goals, schedule, reminders, settings, your
          character, your AI API key — is stored only in your browser/app local storage, on your device.
          We don&apos;t collect it, we can&apos;t see it, and we never sell it.
        </p>
      </Section>

      <Section title="What we store, and where">
        <p>
          All app data lives in your device&apos;s local storage (keys prefixed <code>lifeos:v1:</code>).
          It never leaves your device unless you explicitly use the AI assistant (see below). To erase
          everything, use <span className="text-text">Settings → Danger zone → Reset everything</span>,
          clear the app&apos;s data, or uninstall.
        </p>
      </Section>

      <Section title="The AI assistant (optional)">
        <p>
          If you enter an Anthropic API key in Settings and use the Game Master chat or the &ldquo;AI
          Plan for Today&rdquo;, your messages and a snapshot of your app context (goals, current season,
          today&apos;s schedule, ritual steps, upcoming reminders, the date) are sent{' '}
          <span className="text-text">directly from your device to Anthropic</span> (
          <code>api.anthropic.com</code>) using <span className="text-text">your own API key</span>. That
          request does not pass through any Ryse server. Anthropic processes it under their own privacy
          policy and terms — see{' '}
          <a
            href="https://www.anthropic.com/legal/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent2"
          >
            anthropic.com/legal/privacy
          </a>
          . If you never add a key, no data is sent anywhere.
        </p>
      </Section>

      <Section title="Notifications">
        <p>
          Reminders are scheduled and fired on your device using your browser/OS notification system.
          There are no push servers — nothing about your reminders is transmitted off-device.
        </p>
      </Section>

      <Section title="Third-party content loaded by the app">
        <p>
          The app loads web fonts from Google Fonts (<code>fonts.googleapis.com</code>,{' '}
          <code>fonts.gstatic.com</code>) and emoji/avatar artwork from a public CDN (jsDelivr /
          OpenMoji). When your device requests these files, those services receive your IP address and
          standard request metadata, governed by their own privacy policies. We don&apos;t control or
          receive that data. The web version is hosted on Vercel, which keeps standard server access
          logs (IP, timestamp, requested URL) — see{' '}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent2"
          >
            vercel.com/legal/privacy-policy
          </a>
          . The installed mobile app bundles its assets, so it only talks to Anthropic (if you use the
          AI) and those font/icon CDNs.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Ryse isn&apos;t directed at children under 13 (or under 16 in the EEA). If you&apos;re below
          that age, please don&apos;t use the app without a parent or guardian&apos;s permission.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          Because no data leaves your device by default, there&apos;s nothing for us to delete or export
          on your behalf — you have full control via the app&apos;s reset option or by clearing/uninstalling.
          The AI feature is off until you add a key, and you can remove the key at any time in Settings.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If this policy changes, the &ldquo;Last updated&rdquo; date above will change with it.
          Material changes will be reflected here.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about privacy in Ryse?{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:text-accent2">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </div>
  )
}

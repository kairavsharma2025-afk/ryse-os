import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Moon, Smartphone } from 'lucide-react'
import { useSettings } from '@/stores/settingsStore'
import { useCharacter } from '@/stores/characterStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { THEMES } from '@/data/themes'
import { Pill } from '@/components/ui/Pill'
import { clearAll } from '@/stores/persist'
import { ASSISTANT_MODEL } from '@/engine/claudeApi'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function Settings() {
  const settings = useSettings()
  const c = useCharacter()
  const [showKey, setShowKey] = useState(false)
  const keySet = !!settings.anthropicApiKey?.trim()
  const { canPrompt, promptInstall, installed, isIOSSafari } = useInstallPrompt()

  const notifPerm: NotificationPermission | 'unsupported' =
    typeof window !== 'undefined' && 'Notification' in window
      ? window.Notification.permission
      : 'unsupported'

  const requestNotifications = async () => {
    const N = typeof window !== 'undefined' ? window.Notification : undefined
    if (!N) return
    const r = await N.requestPermission()
    settings.set('notifications', r === 'granted' ? 'granted' : 'denied')
  }

  const reset = () => {
    if (!confirm('This will erase your character, goals, and all progress. Continue?')) return
    clearAll()
    location.reload()
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-wide">Settings</h1>

      <Card variant={keySet ? 'glow' : 'default'} className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-accent" strokeWidth={1.8} />
          <h3 className="font-display text-lg">AI Assistant</h3>
          <span
            className={`ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              keySet
                ? 'text-accent2 border-accent2/40 bg-accent2/10'
                : 'text-red-400 border-red-500/40 bg-red-500/10'
            }`}
          >
            {keySet ? '● Assistant active' : '● No API key — assistant disabled'}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed mb-3">
          Paste your Anthropic API key to wake the Game Master — it plans your day, builds reminders,
          and keeps the season on track. The key is stored only in this browser&apos;s localStorage and
          is sent directly to <code className="text-accent2">api.anthropic.com</code> (model{' '}
          <code className="text-accent2">{ASSISTANT_MODEL}</code>). Get one at{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent2"
          >
            console.anthropic.com
          </a>
          .
        </p>
        <div className="flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={settings.anthropicApiKey}
            onChange={(e) => settings.set('anthropicApiKey', e.target.value.trim())}
            placeholder="sk-ant-..."
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/50"
          />
          <Button variant="ghost" size="sm" onClick={() => setShowKey((v) => !v)}>
            {showKey ? 'Hide' : 'Show'}
          </Button>
          {keySet && (
            <Button variant="subtle" size="sm" onClick={() => settings.set('anthropicApiKey', '')}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {!installed && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-5 h-5 text-accent" strokeWidth={1.8} />
            <h3 className="font-display text-lg">Install Ryse</h3>
          </div>
          {canPrompt ? (
            <>
              <p className="text-xs text-muted leading-relaxed mb-3">
                Add Ryse to your home screen — full-screen, its own app icon, works offline-ish.
              </p>
              <Button onClick={() => void promptInstall()}>
                <Smartphone className="w-3.5 h-3.5" />
                Install on this device
              </Button>
            </>
          ) : isIOSSafari ? (
            <p className="text-xs text-muted leading-relaxed">
              On iPhone/iPad: tap <span className="text-text">Share</span>, then{' '}
              <span className="text-text">&ldquo;Add to Home Screen&rdquo;</span>. Ryse then opens
              full-screen with its own icon.
            </p>
          ) : (
            <p className="text-xs text-muted leading-relaxed">
              Use your browser&apos;s menu → <span className="text-text">&ldquo;Install app&rdquo;</span>{' '}
              / <span className="text-text">&ldquo;Add to Home Screen&rdquo;</span> to run Ryse as a
              standalone app.
            </p>
          )}
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const owned = c.unlockedThemes.includes(t.id)
            const active = c.activeTheme === t.id
            return (
              <button
                key={t.id}
                disabled={!owned}
                onClick={() => c.setActiveTheme(t.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  active
                    ? 'border-accent shadow-glow bg-accent/10'
                    : owned
                      ? 'border-border bg-surface hover:border-accent/40'
                      : 'border-border bg-surface/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <div
                  className="h-10 rounded mb-2 border border-border"
                  style={{
                    background: `linear-gradient(135deg, ${t.preview.bg}, ${t.preview.surface}, ${t.preview.accent})`,
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">{owned ? t.name : '???'}</span>
                  <Pill color={t.rarity}>{t.rarity}</Pill>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">Notifications</h3>
        {notifPerm === 'granted' ? (
          <div>
            <div className="text-sm">
              Status: <span className="text-accent2">Active</span>
            </div>
            <div className="text-xs text-muted mt-1">
              You&apos;ll get desktop pings for your reminders. In-app notifications always work too.
            </div>
          </div>
        ) : notifPerm === 'denied' ? (
          <div className="space-y-3">
            <div className="text-sm">
              Status: <span className="text-red-400">Blocked</span>
            </div>
            <div className="text-xs text-muted leading-relaxed">
              Browser notifications are blocked. To enable them, click the lock/info icon in your
              browser&apos;s address bar, set <span className="text-text">Notifications</span> to
              &ldquo;Allow&rdquo;, then reload the page.
            </div>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        ) : notifPerm === 'unsupported' ? (
          <div className="text-xs text-muted">
            This browser doesn&apos;t support desktop notifications. In-app notifications still work.
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm">
                Status: <span className="text-muted">Not enabled</span>
              </div>
              <div className="text-xs text-muted mt-1">
                In-app notifications always work. Allow browser notifications for desktop pings.
              </div>
            </div>
            <Button onClick={requestNotifications}>Enable</Button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-5 h-5 text-accent" strokeWidth={1.8} />
          <h3 className="font-display text-lg">Quiet hours</h3>
        </div>
        <label className="flex items-start gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={!!settings.quietHours}
            onChange={(e) =>
              settings.set('quietHours', e.target.checked ? { from: '22:00', to: '07:00' } : undefined)
            }
            className="mt-1"
          />
          <div>
            <div className="text-sm">Hold reminders during these hours</div>
            <div className="text-xs text-muted leading-relaxed">
              Anything that would ping in this window waits until it&apos;s over. Sleep is a quest too.
            </div>
          </div>
        </label>
        {settings.quietHours && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">From</div>
              <input
                type="time"
                value={settings.quietHours.from}
                onChange={(e) => {
                  const qh = settings.quietHours
                  if (qh) settings.set('quietHours', { ...qh, from: e.target.value })
                }}
                className="bg-surface2 border border-border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">To</div>
              <input
                type="time"
                value={settings.quietHours.to}
                onChange={(e) => {
                  const qh = settings.quietHours
                  if (qh) settings.set('quietHours', { ...qh, to: e.target.value })
                }}
                className="bg-surface2 border border-border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">Sound</h3>
        <label className="flex items-center justify-between mb-3 cursor-pointer">
          <span className="text-sm">Master sound</span>
          <input
            type="checkbox"
            checked={settings.sound.master}
            onChange={() => settings.toggleSound()}
          />
        </label>
        <div className="grid grid-cols-2 gap-2 opacity-80">
          {(Object.keys(settings.sound.byCategory) as (keyof typeof settings.sound.byCategory)[]).map(
            (k) => (
              <label
                key={k}
                className="flex items-center justify-between p-2 rounded bg-surface2/40 cursor-pointer"
              >
                <span className="text-xs">{k}</span>
                <input
                  type="checkbox"
                  checked={settings.sound.byCategory[k]}
                  onChange={() => settings.toggleSound(k)}
                  disabled={!settings.sound.master}
                />
              </label>
            )
          )}
        </div>
        <div className="text-[11px] text-muted mt-3">
          Sound is wired in for future use. Howler can be added without re-architecting.
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">Game</h3>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.hardModeXp}
            onChange={(e) => settings.set('hardModeXp', e.target.checked)}
            className="mt-1"
          />
          <div>
            <div className="text-sm">Hard mode (0.7× XP)</div>
            <div className="text-xs text-muted leading-relaxed">
              Slows progression. Earn legendary glow on every achievement.
            </div>
          </div>
        </label>
        <label className="flex items-start gap-2 cursor-pointer mt-3">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => settings.set('reduceMotion', e.target.checked)}
            className="mt-1"
          />
          <div>
            <div className="text-sm">Reduce motion</div>
            <div className="text-xs text-muted leading-relaxed">
              Tones down celebration animations.
            </div>
          </div>
        </label>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3">Times</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">
              Wake time
            </div>
            <input
              type="time"
              value={settings.wakeTime}
              onChange={(e) => settings.set('wakeTime', e.target.value)}
              className="bg-surface2 border border-border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">
              Wind down
            </div>
            <input
              type="time"
              value={settings.windDownTime}
              onChange={(e) => settings.set('windDownTime', e.target.value)}
              className="bg-surface2 border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg mb-3 text-red-400">Danger zone</h3>
        <div className="text-xs text-muted mb-3">
          Erase your character and start over. This cannot be undone.
        </div>
        <Button variant="danger" onClick={reset}>
          Reset everything
        </Button>
      </Card>

      <div className="text-center text-[11px] text-muted/70 pt-2">
        <Link to="/privacy" className="hover:text-accent transition-colors">
          Privacy policy
        </Link>{' '}
        · Ryse keeps everything on your device.
      </div>
    </div>
  )
}

import { Palette, Moon, Sun } from 'lucide-react'
import { useSettings } from '@/stores/settingsStore'
import { useCharacter } from '@/stores/characterStore'
import { Pill } from '@/components/ui/Pill'
import { THEMES } from '@/data/themes'
import { SettingsSection } from './SettingsSection'

export function AppearanceSection() {
  const settings = useSettings()
  const c = useCharacter()

  return (
    <SettingsSection
      id="appearance"
      icon={Palette}
      title="Appearance"
      description="Light or dark canvas. Every theme has both."
    >
      <div className="grid grid-cols-2 gap-3 mb-5">
        {(['dark', 'light'] as const).map((mode) => {
          const active = settings.colorMode === mode
          const Icon = mode === 'dark' ? Moon : Sun
          return (
            <button
              key={mode}
              onClick={() => settings.set('colorMode', mode)}
              className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-3 ${
                active
                  ? 'border-accent bg-accent/10 shadow-card'
                  : 'border-border/40 bg-surface2/40 hover:border-accent/40'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                  active
                    ? 'border-accent/50 bg-accent/15 text-accent'
                    : 'border-border/30 bg-surface text-muted'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div>
                <div className="text-sm capitalize">{mode} mode</div>
                <div className="text-[11px] text-muted">
                  {mode === 'dark' ? 'Starfield over deep blue' : 'Bright sky, soft glass'}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Theme</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {THEMES.map((t) => {
          const owned = c.unlockedThemes.includes(t.id)
          const active = c.activeTheme === t.id
          return (
            <button
              key={t.id}
              disabled={!owned}
              onClick={() => c.setActiveTheme(t.id)}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                active
                  ? 'border-accent shadow-card bg-accent/5'
                  : owned
                    ? 'border-border/40 bg-surface hover:border-accent/40'
                    : 'border-border/40 bg-surface/40 opacity-50 cursor-not-allowed'
              }`}
            >
              <div
                className="h-10 rounded-md mb-2 border border-border/30"
                style={{
                  background: `linear-gradient(135deg, ${t.preview.bg}, ${t.preview.surface}, ${t.preview.accent})`,
                }}
              />
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs truncate">{owned ? t.name : '???'}</span>
                <Pill color={t.rarity}>{t.rarity}</Pill>
              </div>
            </button>
          )
        })}
      </div>
    </SettingsSection>
  )
}

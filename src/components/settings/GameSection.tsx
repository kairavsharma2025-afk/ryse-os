import { Gamepad2 } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { useSettings } from '@/stores/settingsStore'
import { SettingsSection } from './SettingsSection'
import type { SoundCategory } from '@/types'

const SOUND_LABEL: Record<SoundCategory, string> = {
  questComplete: 'Quest complete',
  levelUp: 'Level up',
  achievement: 'Achievement',
  boss: 'Boss',
  streak: 'Streak',
  loot: 'Loot',
  streakBroken: 'Streak broken',
}

export function GameSection() {
  const settings = useSettings()

  return (
    <SettingsSection
      id="game"
      icon={Gamepad2}
      title="Game"
      description="Difficulty and feedback knobs that change how Ryse feels."
    >
      <div className="space-y-5">
        <Toggle
          checked={settings.hardModeXp}
          onChange={(v) => settings.set('hardModeXp', v)}
          label="Hard mode (0.7× XP)"
          hint="Slows progression. Earn legendary glow on every achievement."
        />
        <Toggle
          checked={settings.reduceMotion}
          onChange={(v) => settings.set('reduceMotion', v)}
          label="Reduce motion"
          hint="Tones down celebration animations."
        />

        <hr className="border-border/30" />

        <div>
          <Toggle
            checked={settings.sound.master}
            onChange={() => settings.toggleSound()}
            label="Master sound"
            hint="When this is off, every category below is silenced."
          />
          <div
            className={`mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 ${
              settings.sound.master ? '' : 'opacity-50 pointer-events-none'
            }`}
          >
            {(Object.keys(settings.sound.byCategory) as SoundCategory[]).map((k) => (
              <label
                key={k}
                className="flex items-center justify-between p-2 rounded-lg bg-surface2/40 border border-border/30 cursor-pointer text-xs"
              >
                <span className="truncate">{SOUND_LABEL[k] ?? k}</span>
                <Toggle
                  checked={settings.sound.byCategory[k]}
                  onChange={() => settings.toggleSound(k)}
                  disabled={!settings.sound.master}
                />
              </label>
            ))}
          </div>
          <div className="text-[10px] text-muted/70 mt-3">
            Sound is wired in for future use. Howler can be added without re-architecting.
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}

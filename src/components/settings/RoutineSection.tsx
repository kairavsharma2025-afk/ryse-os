import { Sunrise, Car } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { useSettings } from '@/stores/settingsStore'
import { syncWakeReminder, syncMealReminders } from '@/engine/dailyRemindersSync'
import { SettingsSection } from './SettingsSection'

export function RoutineSection() {
  const settings = useSettings()

  return (
    <SettingsSection
      id="routine"
      icon={Sunrise}
      title="Daily routine"
      description="Your wake time, meal anchors, and the optional ride-home nudge."
    >
      <div className="space-y-5">
        {/* Wake-up */}
        <div>
          <Toggle
            checked={settings.wakeAlarm}
            onChange={(v) => {
              settings.set('wakeAlarm', v)
              syncWakeReminder()
            }}
            label="Wake-up nudge"
            hint="A daily notification at your wake time. (For a loud alarm, your phone's clock app still wins.)"
          />
          <div className="grid grid-cols-2 gap-3 max-w-md mt-3">
            <Time
              label="Wake time"
              value={settings.wakeTime}
              onChange={(t) => {
                settings.set('wakeTime', t)
                syncWakeReminder()
              }}
            />
            <Time
              label="Wind down"
              value={settings.windDownTime}
              onChange={(t) => settings.set('windDownTime', t)}
            />
          </div>
        </div>

        <hr className="border-border/30" />

        {/* Meals */}
        <div>
          <Toggle
            checked={settings.mealReminders}
            onChange={(v) => {
              settings.set('mealReminders', v)
              syncMealReminders()
            }}
            label="Meal reminders"
            hint="Reminders at your usual breakfast, lunch & dinner — eating well is a Health quest."
          />
          <div
            className={`grid grid-cols-3 gap-3 mt-3 ${
              settings.mealReminders ? '' : 'opacity-40 pointer-events-none'
            }`}
          >
            {(
              [
                ['Breakfast', 'breakfastTime'],
                ['Lunch', 'lunchTime'],
                ['Dinner', 'dinnerTime'],
              ] as const
            ).map(([label, key]) => (
              <Time
                key={key}
                label={label}
                value={settings[key]}
                onChange={(t) => {
                  settings.set(key, t)
                  syncMealReminders()
                }}
              />
            ))}
          </div>
          <div className="text-[11px] text-muted/70 mt-3">
            These show up on the Reminders page — snooze or tweak them there too.
          </div>
        </div>

        <hr className="border-border/30" />

        {/* Ride nudges */}
        <div>
          <Toggle
            checked={settings.rideNudges}
            onChange={(v) => settings.set('rideNudges', v)}
            label={
              <span className="inline-flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-accent" />
                Ride nudges
              </span>
            }
            hint='A floating "book an Uber?" prompt near the start and end of your office block — any Career event whose title contains "office", "work" or "commute".'
          />
          <div className={settings.rideNudges ? 'mt-3' : 'mt-3 opacity-40 pointer-events-none'}>
            <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">
              Nudge me this long before I leave
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => settings.set('officeLeaveLeadMin', m)}
                  className={`px-3 h-8 rounded-lg border text-xs transition-colors ${
                    settings.officeLeaveLeadMin === m
                      ? 'border-accent bg-accent/10 text-text'
                      : 'border-border/40 bg-surface2/40 text-muted hover:text-text'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SettingsSection>
  )
}

function Time({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (t: string) => void
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted mb-1.5">{label}</div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface2 border border-border/40 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-accent/60"
      />
    </div>
  )
}

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSettings } from '@/stores/settingsStore'
import { ASSISTANT_MODEL } from '@/engine/claudeApi'
import { SettingsSection } from './SettingsSection'

export function AssistantSection() {
  const settings = useSettings()
  const [show, setShow] = useState(false)
  const keySet = !!settings.anthropicApiKey?.trim()

  return (
    <SettingsSection
      id="assistant"
      icon={Bot}
      title="AI Assistant"
      description={
        <>
          Paste an Anthropic API key to wake the Game Master — it plans the day, builds reminders,
          and keeps the season on track. The key stays in this browser's localStorage and is sent
          directly to <code className="text-accent2">api.anthropic.com</code> (model{' '}
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
        </>
      }
      right={
        <span
          className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${
            keySet
              ? 'text-accent2 border-accent2/40 bg-accent2/10'
              : 'text-red-400 border-red-500/40 bg-red-500/10'
          }`}
        >
          {keySet ? '● Active' : '● Disabled'}
        </span>
      }
    >
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={settings.anthropicApiKey}
          onChange={(e) => settings.set('anthropicApiKey', e.target.value.trim())}
          placeholder="sk-ant-..."
          spellCheck={false}
          autoComplete="off"
          className="flex-1 min-w-[180px] bg-surface2 border border-border/40 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60 transition-colors"
        />
        <Button variant="ghost" size="sm" onClick={() => setShow((v) => !v)}>
          {show ? 'Hide' : 'Show'}
        </Button>
        {keySet && (
          <Button variant="subtle" size="sm" onClick={() => settings.set('anthropicApiKey', '')}>
            Clear
          </Button>
        )}
      </div>
    </SettingsSection>
  )
}

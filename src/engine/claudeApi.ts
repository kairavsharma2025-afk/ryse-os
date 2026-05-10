// Thin client for the Anthropic Messages API, called directly from the browser
// using the user's own API key (stored in settings). No backend.

import { useSettings } from '@/stores/settingsStore'

// Latest available Sonnet at time of writing. Bump as new versions ship.
export const ASSISTANT_MODEL = 'claude-sonnet-4-5'

const API_URL = 'https://api.anthropic.com/v1/messages'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export function getApiKey(): string {
  return (useSettings.getState().anthropicApiKey ?? '').trim()
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0
}

interface ContentBlock {
  type: string
  text?: string
}

export async function callClaude(args: {
  system: string
  messages: ClaudeMessage[]
  maxTokens?: number
}): Promise<string> {
  const key = getApiKey()
  if (!key) {
    throw new Error('No Anthropic API key — add one in Settings to wake the assistant.')
  }

  let res: Response
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        max_tokens: args.maxTokens ?? 1024,
        system: args.system,
        messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
  } catch (e) {
    throw new Error(
      `Could not reach the Anthropic API (${(e as Error).message}). Check your connection.`
    )
  }

  if (!res.ok) {
    let detail = ''
    try {
      const j = (await res.json()) as { error?: { message?: string } }
      detail = j?.error?.message ?? JSON.stringify(j)
    } catch {
      detail = await res.text().catch(() => '')
    }
    throw new Error(`Anthropic API error ${res.status}: ${detail || res.statusText}`)
  }

  const data = (await res.json()) as { content?: ContentBlock[] }
  const text = (data.content ?? [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n')
    .trim()
  return text || '(the assistant returned an empty response)'
}

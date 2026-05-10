import type { ReactNode } from 'react'

// Tiny markdown-ish renderer: paragraphs, bullet lists, **bold**, *italic*, `code`.
// Deliberately minimal — the assistant is told to keep formatting light.

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="text-text font-semibold">
          {tok.slice(2, -2)}
        </strong>
      )
    } else if (tok.startsWith('`')) {
      nodes.push(
        <code key={key++} className="px-1 py-0.5 rounded bg-surface2/70 text-accent2 text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      )
    } else {
      nodes.push(
        <em key={key++} className="italic">
          {tok.slice(1, -1)}
        </em>
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  let key = 0

  const flushBullets = () => {
    if (!bullets.length) return
    blocks.push(
      <ul key={key++} className="list-disc pl-5 space-y-1">
        {bullets.map((b, i) => (
          <li key={i}>{renderInline(b)}</li>
        ))}
      </ul>
    )
    bullets = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      bullets.push(bullet[1])
      continue
    }
    flushBullets()
    if (line.trim() === '') {
      blocks.push(<div key={key++} className="h-2" />)
      continue
    }
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {renderInline(line)}
      </p>
    )
  }
  flushBullets()

  return <div className={`space-y-1.5 ${className}`}>{blocks}</div>
}

import { useEffect, useMemo, useState } from 'react'
import { Pin, PinOff, Trash2, StickyNote, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { useNotes } from '@/stores/notesStore'
import { AREA_LIST, AREAS } from '@/data/areas'
import type { AreaId, Note } from '@/types'

const inputCls =
  'w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50'
const labelCls = 'text-[10px] uppercase tracking-[0.2em] text-muted mb-1.5 block'
const segCls = (active: boolean) =>
  `px-2 py-1.5 rounded-md border text-xs transition ${
    active
      ? 'border-accent bg-accent/10 text-text'
      : 'border-border bg-surface2/40 text-muted hover:text-text'
  }`

/**
 * Notes view — quick-capture jotting. Pinned notes float to the top, the rest
 * sorts by updatedAt desc. Tap a note to edit; pin/unpin and delete are inline.
 */
export function PlanNotes() {
  const notes = useNotes((s) => s.notes)
  const addNote = useNotes((s) => s.addNote)
  const updateNote = useNotes((s) => s.updateNote)
  const deleteNote = useNotes((s) => s.deleteNote)
  const togglePin = useNotes((s) => s.togglePin)

  const [editing, setEditing] = useState<Note | null>(null)
  const [adding, setAdding] = useState(false)

  const { pinned, recent } = useMemo(() => {
    const sorted = [...notes].sort((a, b) =>
      a.pinned === b.pinned ? b.updatedAt.localeCompare(a.updatedAt) : a.pinned ? -1 : 1
    )
    return {
      pinned: sorted.filter((n) => n.pinned),
      recent: sorted.filter((n) => !n.pinned),
    }
  }, [notes])

  if (notes.length === 0) {
    return (
      <>
        <Empty
          icon={StickyNote}
          title="Capture anything."
          body="Ideas, snippets from a call, half-formed plans. Notes that don't have a date yet live here."
          cta={<Button onClick={() => setAdding(true)}>New note</Button>}
        />
        <NoteEditorModal
          open={adding}
          onClose={() => setAdding(false)}
          onSave={(b, c) => {
            if (b.trim()) addNote({ body: b.trim(), category: c, pinned: false })
            setAdding(false)
          }}
        />
      </>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          {pinned.length > 0 && <span> · {pinned.length} pinned</span>}
        </p>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="w-3.5 h-3.5" />
          New note
        </Button>
      </div>

      {pinned.length > 0 && (
        <section>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-2 px-1">Pinned</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinned.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onOpen={setEditing}
                onPin={() => togglePin(n.id)}
                onDelete={() => deleteNote(n.id)}
              />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-2 px-1">Recent</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recent.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onOpen={setEditing}
                onPin={() => togglePin(n.id)}
                onDelete={() => deleteNote(n.id)}
              />
            ))}
          </div>
        </section>
      )}

      <NoteEditorModal
        open={adding}
        onClose={() => setAdding(false)}
        onSave={(b, c) => {
          if (b.trim()) addNote({ body: b.trim(), category: c, pinned: false })
          setAdding(false)
        }}
      />
      <NoteEditorModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        initial={editing ?? undefined}
        onSave={(b, c) => {
          if (editing) updateNote(editing.id, { body: b.trim(), category: c })
          setEditing(null)
        }}
      />
    </div>
  )
}

function NoteCard({
  note,
  onOpen,
  onPin,
  onDelete,
}: {
  note: Note
  onOpen: (n: Note) => void
  onPin: () => void
  onDelete: () => void
}) {
  const area = note.category ? AREAS[note.category] : null
  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-elevated transition-shadow"
      onClick={() => onOpen(note)}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
          {area && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: `rgb(var(--${area.color}))` }}
            />
          )}
          <span>{format(parseISO(note.updatedAt), 'MMM d, h:mm a')}</span>
        </div>
        <div className="flex items-center gap-0.5 -mr-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin()
            }}
            className={`p-1 rounded hover:bg-surface2/60 ${
              note.pinned ? 'text-accent' : 'text-muted hover:text-text'
            }`}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          >
            {note.pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 rounded text-muted hover:text-red-400 hover:bg-surface2/60"
            aria-label="Delete note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="text-sm text-text whitespace-pre-wrap line-clamp-6 leading-snug">
        {note.body}
      </div>
    </Card>
  )
}

function NoteEditorModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean
  onClose: () => void
  initial?: Note
  onSave: (body: string, category?: AreaId) => void
}) {
  const [body, setBody] = useState(initial?.body ?? '')
  const [category, setCategory] = useState<AreaId | ''>(initial?.category ?? '')

  useEffect(() => {
    if (open) {
      setBody(initial?.body ?? '')
      setCategory(initial?.category ?? '')
    }
    // Re-prime when the modal opens or the note identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit note' : 'New note'} size="md">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Note</label>
          <textarea
            className={`${inputCls} resize-y min-h-[140px]`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Brain dump, link, half-finished thought…"
            autoFocus
          />
        </div>
        <div>
          <label className={labelCls}>Category (optional)</label>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={segCls(category === '')}
            >
              None
            </button>
            {AREA_LIST.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setCategory(a.id)}
                className={segCls(category === a.id)}
              >
                {a.emoji} {a.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => {
              onSave(body, category || undefined)
              setBody('')
              setCategory('')
            }}
            disabled={!body.trim()}
          >
            Save
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setBody('')
              setCategory('')
              onClose()
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

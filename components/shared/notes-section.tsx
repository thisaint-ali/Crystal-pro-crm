'use client'

import { useState } from 'react'
import { Loader2, Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import type { NoteWithAuthor } from '@/types/crm'

interface NotesSectionProps {
  notes: NoteWithAuthor[]
  entityType: 'lead' | 'customer' | 'quote' | 'job'
  entityId: string
  onAdd: (note: string) => Promise<{ error?: string }>
  canAdd?: boolean
}

export function NotesSection({
  notes,
  entityType,
  entityId,
  onAdd,
  canAdd = true,
}: NotesSectionProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [localNotes, setLocalNotes] = useState<NoteWithAuthor[]>(notes)

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    const result = await onAdd(text.trim())
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      // Optimistic: prepend a placeholder note
      setLocalNotes((prev) => [
        {
          id: `temp-${Date.now()}`,
          entity_type: entityType,
          entity_id: entityId,
          note: text.trim(),
          created_by: null,
          created_at: new Date().toISOString(),
          author: null,
        },
        ...prev,
      ])
      setText('')
      toast({ title: 'Note added' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-gray-900">Notes</h3>
        <span className="text-xs text-gray-400">({localNotes.length})</span>
      </div>

      {canAdd && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!text.trim() || saving}
          >
            {saving ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Plus className="w-3 h-3 mr-1" />
            )}
            Add Note
          </Button>
        </div>
      )}

      {localNotes.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {localNotes.map((note) => (
            <div key={note.id} className="flex gap-3">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {getInitials(note.author?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {note.author?.full_name ?? 'Team Member'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(note.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use server'

import { createClient } from '@/lib/supabase/server'

export async function logActivity(
  entityType: string,
  entityId: string,
  action: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('activity_log').insert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
    })
  } catch {
    // Activity logging should never crash the main operation
  }
}

export async function addNote(
  entityType: 'lead' | 'customer' | 'quote' | 'job',
  entityId: string,
  note: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('notes').insert({
    entity_type: entityType,
    entity_id: entityId,
    note,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  await logActivity(entityType, entityId, 'note_added', null, { note: note.slice(0, 100) })
  return {}
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from './activity'

async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  return { user, profile, supabase }
}

export interface CreateTaskInput {
  title: string
  description?: string
  task_type?: string
  lead_id?: string
  customer_id?: string
  quote_id?: string
  job_id?: string
  assigned_to?: string
  due_date?: string
  due_time?: string
  priority?: string
}

export async function createTask(input: CreateTaskInput): Promise<{ error?: string; id?: string }> {
  const { user, profile, supabase } = await getCurrentUser()
  if (!['admin', 'manager'].includes(profile?.role ?? '')) return { error: 'Permission denied' }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description || null,
      task_type: input.task_type || null,
      lead_id: input.lead_id || null,
      customer_id: input.customer_id || null,
      quote_id: input.quote_id || null,
      job_id: input.job_id || null,
      assigned_to: input.assigned_to || user.id,
      due_date: input.due_date || null,
      due_time: input.due_time || null,
      status: 'open',
      priority: (input.priority as any) || 'normal',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logActivity(
    input.lead_id ? 'lead' : input.job_id ? 'job' : 'customer',
    (input.lead_id || input.job_id || input.customer_id) ?? task.id,
    'task_created',
    null,
    { title: input.title }
  )
  revalidatePath('/tasks')
  return { id: task.id }
}

export async function completeTask(id: string): Promise<{ error?: string }> {
  const { user, profile, supabase } = await getCurrentUser()

  // Workers can complete their own tasks
  if (profile?.role === 'worker') {
    const { data: task } = await supabase.from('tasks').select('assigned_to').eq('id', id).single()
    if (task?.assigned_to !== user.id) return { error: 'Permission denied' }
  }

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  await logActivity('task' as any, id, 'task_completed')
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return {}
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin only' }

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/tasks')
  return {}
}

import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  task_type: z
    .enum(['call', 'text', 'email', 'follow_up', 'estimate', 'collect_payment', 'request_review', 'other'])
    .optional()
    .or(z.literal('')),
  lead_id: z.string().uuid().optional().or(z.literal('')),
  customer_id: z.string().uuid().optional().or(z.literal('')),
  quote_id: z.string().uuid().optional().or(z.literal('')),
  job_id: z.string().uuid().optional().or(z.literal('')),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  due_time: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
})

export type TaskFormData = z.infer<typeof taskSchema>

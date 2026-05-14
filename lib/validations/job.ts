import { z } from 'zod'

export const jobSchema = z.object({
  customer_id: z.string().uuid().optional().or(z.literal('')),
  lead_id: z.string().uuid().optional().or(z.literal('')),
  quote_id: z.string().uuid().optional().or(z.literal('')),
  service_type: z.string().min(1, 'Service type is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().default('VA'),
  zip_code: z.string().max(20).optional().or(z.literal('')),
  scheduled_date: z.string().min(1, 'Scheduled date is required'),
  start_time: z.string().optional().or(z.literal('')),
  end_time: z.string().optional().or(z.literal('')),
  assigned_to: z.string().uuid('Worker must be selected').min(1, 'Assign a worker'),
  price: z.coerce.number().min(0).optional().or(z.literal('')),
  crew_notes: z.string().max(2000).optional().or(z.literal('')),
  customer_notes: z.string().max(2000).optional().or(z.literal('')),
  internal_notes: z.string().max(2000).optional().or(z.literal('')),
  status: z
    .enum(['scheduled', 'on_the_way', 'in_progress', 'completed', 'cancelled'])
    .default('scheduled'),
  payment_status: z
    .enum(['unpaid', 'deposit_paid', 'paid', 'refunded'])
    .default('unpaid'),
})

export type JobFormData = z.infer<typeof jobSchema>

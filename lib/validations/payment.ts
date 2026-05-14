import { z } from 'zod'

export const paymentSchema = z.object({
  job_id: z.string().uuid().optional().or(z.literal('')),
  customer_id: z.string().uuid().optional().or(z.literal('')),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z
    .enum(['cash', 'check', 'zelle', 'venmo', 'cashapp', 'credit_card', 'stripe', 'other'])
    .optional()
    .or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  paid_at: z.string().optional().or(z.literal('')),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

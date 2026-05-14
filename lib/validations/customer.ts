import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(30),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().default('VA'),
  zip_code: z.string().max(20).optional().or(z.literal('')),
  customer_type: z.enum(['residential', 'commercial']).default('residential'),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export type CustomerFormData = z.infer<typeof customerSchema>

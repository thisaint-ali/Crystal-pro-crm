import { z } from 'zod'

export const quoteItemSchema = z.object({
  id: z.string().optional(),
  service_name: z.string().min(1, 'Service name is required'),
  description: z.string().optional().or(z.literal('')),
  quantity: z.coerce.number().min(1).default(1),
  unit_price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  total_price: z.coerce.number().min(0),
})

export const quoteSchema = z.object({
  lead_id: z.string().uuid().optional().or(z.literal('')),
  customer_id: z.string().uuid().optional().or(z.literal('')),
  service_type: z.string().min(1, 'Service type is required'),
  description: z.string().max(2000).optional().or(z.literal('')),
  quote_amount: z.coerce.number().min(0, 'Quote amount must be 0 or greater'),
  discount_amount: z.coerce.number().min(0).default(0),
  final_amount: z.coerce.number().min(0),
  status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).default('draft'),
  valid_until: z.string().optional().or(z.literal('')),
  follow_up_date: z.string().optional().or(z.literal('')),
  items: z.array(quoteItemSchema).optional(),
})

export type QuoteFormData = z.infer<typeof quoteSchema>
export type QuoteItemFormData = z.infer<typeof quoteItemSchema>

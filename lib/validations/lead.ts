import { z } from 'zod'

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(30),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().default('VA'),
  zip_code: z.string().max(20).optional().or(z.literal('')),
  service_requested: z.string().max(100).optional().or(z.literal('')),
  lead_source: z
    .enum([
      'website',
      'google_business_profile',
      'google_ads',
      'facebook',
      'instagram',
      'referral',
      'yard_sign',
      'door_hanger',
      'repeat_customer',
      'phone_call',
      'other',
    ])
    .optional()
    .or(z.literal('')),
  status: z
    .enum([
      'new',
      'contacted',
      'waiting_on_photos',
      'estimate_needed',
      'quote_sent',
      'follow_up_needed',
      'booked',
      'lost',
    ])
    .default('new'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  estimated_value: z.coerce.number().min(0).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  next_follow_up_at: z.string().optional().or(z.literal('')),
})

export type LeadFormData = z.infer<typeof leadSchema>

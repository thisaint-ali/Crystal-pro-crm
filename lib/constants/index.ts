export const APP_NAME = 'Crystal Pro Powerwashing'
export const APP_DESCRIPTION = 'CRM for Crystal Pro Powerwashing - Northern Virginia'

export const SERVICE_TYPES = [
  'House Washing',
  'Roof Cleaning',
  'Driveway Cleaning',
  'Concrete Cleaning',
  'Window Cleaning',
  'Deck Cleaning',
  'Patio Cleaning',
  'Fence Cleaning',
  'Gutter Cleaning',
  'Soft Washing',
  'Commercial Pressure Washing',
  'Other',
] as const

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'google_business_profile', label: 'Google Business Profile' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Referral' },
  { value: 'yard_sign', label: 'Yard Sign' },
  { value: 'door_hanger', label: 'Door Hanger' },
  { value: 'repeat_customer', label: 'Repeat Customer' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'other', label: 'Other' },
] as const

export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'waiting_on_photos', label: 'Waiting on Photos' },
  { value: 'estimate_needed', label: 'Estimate Needed' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'follow_up_needed', label: 'Follow Up Needed' },
  { value: 'booked', label: 'Booked' },
  { value: 'lost', label: 'Lost' },
] as const

export const QUOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
] as const

export const JOB_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'on_the_way', label: 'On the Way' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
] as const

export const REVIEW_STATUSES = [
  { value: 'not_requested', label: 'Not Requested' },
  { value: 'requested', label: 'Requested' },
  { value: 'completed', label: 'Completed' },
] as const

export const TASK_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export const TASK_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'estimate', label: 'Estimate' },
  { value: 'collect_payment', label: 'Collect Payment' },
  { value: 'request_review', label: 'Request Review' },
  { value: 'other', label: 'Other' },
] as const

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Other' },
] as const

export const PHOTO_TYPES = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'damage', label: 'Damage' },
  { value: 'other', label: 'Other' },
] as const

export const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'worker', label: 'Worker' },
] as const

// Pricing suggestions (display only, not enforced)
export const PRICING_SUGGESTIONS = [
  { service: 'House Washing', min: 250, max: 500 },
  { service: 'Roof Cleaning', min: 400, max: 1200 },
  { service: 'Driveway/Concrete Cleaning', min: 150, max: 400 },
  { service: 'Window Cleaning', min: 150, max: 500 },
  { service: 'Deck/Patio Cleaning', min: 150, max: 600 },
  { service: 'Fence Cleaning', min: 200, max: 700 },
  { service: 'Gutter Cleaning', min: 125, max: 350 },
] as const

export const REVIEW_REQUEST_TEMPLATE =
  "Thanks for choosing Crystal Pro Powerwashing. If you're happy with the results, could you leave us a quick Google review? It really helps our local business."

export const SMS_TEMPLATES = {
  newLead:
    "Hey, this is Crystal Pro Powerwashing. We got your request. Send a few pictures of the area you want cleaned and we'll get you a quote.",
  quoteFollowUp:
    "Hey, just checking if you had any questions about the quote we sent.",
  bookingConfirmation:
    "You're booked with Crystal Pro Powerwashing for [date/time]. Please make sure water access is available and any cars/items are moved away from the cleaning area.",
  onTheWay:
    'Crystal Pro Powerwashing is on the way to your property.',
  reviewRequest:
    "Thanks for choosing Crystal Pro Powerwashing. If you're happy with the results, could you leave us a quick Google review?",
} as const

export const US_STATES = [
  { value: 'VA', label: 'Virginia' },
  { value: 'MD', label: 'Maryland' },
  { value: 'DC', label: 'Washington DC' },
] as const

export const DEFAULT_STATE = 'VA'

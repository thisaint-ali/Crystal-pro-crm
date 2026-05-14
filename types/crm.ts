import type { Database } from './database'

// Table row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type QuoteItem = Database['public']['Tables']['quote_items']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type JobPhoto = Database['public']['Tables']['job_photos']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type CompanySettings = Database['public']['Tables']['company_settings']['Row']

// Insert types
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type QuoteInsert = Database['public']['Tables']['quotes']['Insert']
export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']

// Role type
export type UserRole = 'admin' | 'manager' | 'worker'

// Status types
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'waiting_on_photos'
  | 'estimate_needed'
  | 'quote_sent'
  | 'follow_up_needed'
  | 'booked'
  | 'lost'

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

export type JobStatus =
  | 'scheduled'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded'

export type ReviewStatus = 'not_requested' | 'requested' | 'completed'

export type TaskStatus = 'open' | 'completed' | 'cancelled'

export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export type PhotoType = 'before' | 'after' | 'damage' | 'other'

export type TaskType =
  | 'call'
  | 'text'
  | 'email'
  | 'follow_up'
  | 'estimate'
  | 'collect_payment'
  | 'request_review'
  | 'other'

export type LeadSource =
  | 'website'
  | 'google_business_profile'
  | 'google_ads'
  | 'facebook'
  | 'instagram'
  | 'referral'
  | 'yard_sign'
  | 'door_hanger'
  | 'repeat_customer'
  | 'phone_call'
  | 'other'

export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'zelle'
  | 'venmo'
  | 'cashapp'
  | 'credit_card'
  | 'stripe'
  | 'other'

// Extended types with joined data
export type LeadWithAssignee = Lead & {
  assignee?: Profile | null
}

export type JobWithCustomer = Job & {
  customer?: Customer | null
  assignee?: Profile | null
}

export type QuoteWithCustomer = Quote & {
  customer?: Customer | null
  lead?: Lead | null
  items?: QuoteItem[]
}

export type TaskWithAssignee = Task & {
  assignee?: Profile | null
}

export type PaymentWithJob = Payment & {
  job?: Job | null
  customer?: Customer | null
}

export type NoteWithAuthor = Note & {
  author?: Profile | null
}

export type ActivityLogWithUser = ActivityLog & {
  user?: Profile | null
}

// Dashboard analytics types
export type DashboardStats = {
  newLeadsToday: number
  newLeadsThisWeek: number
  quotesSent: number
  quotesAccepted: number
  quoteAcceptanceRate: number
  jobsScheduledToday: number
  jobsScheduledThisWeek: number
  jobsCompletedThisMonth: number
  revenueThisWeek: number
  revenueThisMonth: number
  unpaidAmount: number
  averageJobValue: number
  followUpsDueToday: number
  overdueTasksCount: number
}

export type WorkerDashboardStats = {
  jobsToday: number
  upcomingJobs: number
  openTasks: number
  completedThisWeek: number
}

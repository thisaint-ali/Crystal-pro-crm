'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { leadSchema, type LeadFormData } from '@/lib/validations/lead'
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITIES, SERVICE_TYPES } from '@/lib/constants'
import type { Lead, Profile } from '@/types/crm'

interface LeadFormProps {
  lead?: Lead
  teamMembers: Pick<Profile, 'id' | 'full_name'>[]
  onSubmit: (data: FormData) => Promise<{ error?: string; id?: string }>
  submitLabel?: string
}

export function LeadForm({ lead, teamMembers, onSubmit, submitLabel = 'Save Lead' }: LeadFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: lead?.name ?? '',
      phone: lead?.phone ?? '',
      email: lead?.email ?? '',
      address: lead?.address ?? '',
      city: lead?.city ?? '',
      state: lead?.state ?? 'VA',
      zip_code: lead?.zip_code ?? '',
      service_requested: lead?.service_requested ?? '',
      lead_source: (lead?.lead_source as any) ?? '',
      status: (lead?.status as any) ?? 'new',
      priority: (lead?.priority as any) ?? 'normal',
      assigned_to: lead?.assigned_to ?? '',
      estimated_value: lead?.estimated_value ?? '',
      notes: lead?.notes ?? '',
      next_follow_up_at: lead?.next_follow_up_at
        ? new Date(lead.next_follow_up_at).toISOString().split('T')[0]
        : '',
    },
  })

  const handleFormSubmit = async (data: LeadFormData) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          formData.append(k, String(v))
        }
      })

      const result = await onSubmit(formData)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: lead ? 'Lead updated' : 'Lead created' })
        if (result.id) {
          router.push(`/leads/${result.id}`)
        } else {
          router.back()
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Contact info */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Contact Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" placeholder="John Smith" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input id="phone" type="tel" placeholder="(703) 555-0000" {...register('phone')} />
            {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Address</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="address">Street Address</Label>
            <Input id="address" placeholder="123 Main St" {...register('address')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Fairfax" {...register('city')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" defaultValue="VA" {...register('state')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zip_code">Zip Code</Label>
            <Input id="zip_code" placeholder="22033" {...register('zip_code')} />
          </div>
        </div>
      </div>

      {/* Lead details */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Lead Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Service Requested</Label>
            <Select
              value={watch('service_requested')}
              onValueChange={(v) => setValue('service_requested', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Lead Source</Label>
            <Select
              value={watch('lead_source')}
              onValueChange={(v) => setValue('lead_source', v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="How did they find us?" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(v) => setValue('status', v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={watch('priority')}
              onValueChange={(v) => setValue('priority', v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <Select
              value={watch('assigned_to')}
              onValueChange={(v) => setValue('assigned_to', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estimated_value">Estimated Value ($)</Label>
            <Input
              id="estimated_value"
              type="number"
              min="0"
              step="0.01"
              placeholder="350.00"
              {...register('estimated_value')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next_follow_up_at">Next Follow-up Date</Label>
            <Input id="next_follow_up_at" type="date" {...register('next_follow_up_at')} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any details about this lead..."
            rows={4}
            {...register('notes')}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none">
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

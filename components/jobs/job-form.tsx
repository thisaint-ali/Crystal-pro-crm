'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { jobSchema, JobFormData } from '@/lib/validations/job'
import { SERVICE_TYPES, PAYMENT_STATUSES, DEFAULT_STATE, US_STATES } from '@/lib/constants'
import type { CreateJobInput } from '@/lib/actions/jobs'
import { ProximityAlert } from '@/components/map/proximity-alert'

interface JobFormProps {
  workers: { id: string; full_name: string }[]
  customers?: { id: string; name: string }[]
  leads?: { id: string; name: string }[]
  defaultCustomerId?: string
  defaultLeadId?: string
  defaultQuoteId?: string
  initialData?: Partial<JobFormData>
  onSubmit: (input: CreateJobInput) => Promise<{ error?: string; id?: string }>
  submitLabel?: string
  redirectTo?: string
}

export function JobForm({
  workers,
  customers = [],
  leads = [],
  defaultCustomerId,
  defaultLeadId,
  defaultQuoteId,
  initialData,
  onSubmit,
  submitLabel = 'Create Job',
  redirectTo,
}: JobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      customer_id: defaultCustomerId ?? initialData?.customer_id ?? '',
      lead_id: defaultLeadId ?? initialData?.lead_id ?? '',
      quote_id: defaultQuoteId ?? initialData?.quote_id ?? '',
      service_type: initialData?.service_type ?? '',
      address: initialData?.address ?? '',
      city: initialData?.city ?? '',
      state: initialData?.state ?? DEFAULT_STATE,
      zip_code: initialData?.zip_code ?? '',
      scheduled_date: initialData?.scheduled_date ?? '',
      start_time: initialData?.start_time ?? '',
      end_time: initialData?.end_time ?? '',
      assigned_to: initialData?.assigned_to ?? '',
      price: initialData?.price ?? undefined,
      crew_notes: initialData?.crew_notes ?? '',
      customer_notes: initialData?.customer_notes ?? '',
      internal_notes: initialData?.internal_notes ?? '',
      status: initialData?.status ?? 'scheduled',
      payment_status: initialData?.payment_status ?? 'unpaid',
    },
  })

  async function handleFormSubmit(data: JobFormData) {
    setLoading(true)
    setServerError('')
    const result = await onSubmit({
      customer_id: data.customer_id || undefined,
      lead_id: data.lead_id || undefined,
      quote_id: data.quote_id || undefined,
      service_type: data.service_type,
      address: data.address,
      city: data.city || undefined,
      state: data.state,
      zip_code: data.zip_code || undefined,
      scheduled_date: data.scheduled_date,
      start_time: data.start_time || undefined,
      end_time: data.end_time || undefined,
      assigned_to: data.assigned_to,
      price: data.price ? Number(data.price) : undefined,
      crew_notes: data.crew_notes || undefined,
      customer_notes: data.customer_notes || undefined,
      internal_notes: data.internal_notes || undefined,
      payment_status: data.payment_status,
    })
    if (result.error) {
      setServerError(result.error)
      setLoading(false)
    } else {
      router.push(redirectTo ?? (result.id ? `/jobs/${result.id}` : '/jobs'))
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {serverError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {serverError}
        </div>
      )}

      {/* Assignment */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Assignment</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {customers.length > 0 && (
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select
                value={watch('customer_id') || ''}
                onValueChange={(v) => {
                  setValue('customer_id', v === 'none' ? '' : v)
                  if (v !== 'none') setValue('lead_id', '')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {leads.length > 0 && (
            <div className="space-y-1.5">
              <Label>Lead</Label>
              <Select
                value={watch('lead_id') || ''}
                onValueChange={(v) => {
                  setValue('lead_id', v === 'none' ? '' : v)
                  if (v !== 'none') setValue('customer_id', '')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Assigned Worker *</Label>
          <Select value={watch('assigned_to')} onValueChange={(v) => setValue('assigned_to', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.assigned_to && <p className="text-xs text-red-500">{errors.assigned_to.message}</p>}
        </div>
      </div>

      {/* Service */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Service</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Service Type *</Label>
            <Select value={watch('service_type')} onValueChange={(v) => setValue('service_type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_type && <p className="text-xs text-red-500">{errors.service_type.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Price ($)</Label>
            <Input type="number" min="0" step="0.01" placeholder="0.00" {...register('price')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Payment Status</Label>
          <Select value={watch('payment_status')} onValueChange={(v) => setValue('payment_status', v as any)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Location</h2>
        <div className="space-y-1.5">
          <Label>Street Address *</Label>
          <Input placeholder="123 Main St" {...register('address')} />
          {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 space-y-1.5">
            <Label>City</Label>
            <Input placeholder="Herndon" {...register('city')} />
          </div>
          <div className="space-y-1.5">
            <Label>State</Label>
            <Select value={watch('state')} onValueChange={(v) => setValue('state', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ZIP</Label>
            <Input placeholder="20171" {...register('zip_code')} />
          </div>
        </div>
        <ProximityAlert
          address={watch('address') ?? ''}
          city={watch('city') ?? ''}
          state={watch('state') ?? ''}
          zip_code={watch('zip_code') ?? ''}
        />
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Schedule</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input type="date" {...register('scheduled_date')} />
            {errors.scheduled_date && <p className="text-xs text-red-500">{errors.scheduled_date.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input type="time" {...register('start_time')} />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input type="time" {...register('end_time')} />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Notes</h2>
        <div className="space-y-1.5">
          <Label>Crew Notes</Label>
          <Textarea rows={2} placeholder="Instructions for the crew..." {...register('crew_notes')} />
        </div>
        <div className="space-y-1.5">
          <Label>Customer Notes</Label>
          <Textarea rows={2} placeholder="Gate code, dog, water access..." {...register('customer_notes')} />
        </div>
        <div className="space-y-1.5">
          <Label>Internal Notes</Label>
          <Textarea rows={2} placeholder="Admin/manager only notes..." {...register('internal_notes')} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

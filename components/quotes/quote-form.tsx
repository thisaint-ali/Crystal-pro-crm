'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { quoteSchema, QuoteFormData } from '@/lib/validations/quote'
import { SERVICE_TYPES, PRICING_SUGGESTIONS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { CreateQuoteInput } from '@/lib/actions/quotes'

interface QuoteFormProps {
  defaultLeadId?: string
  defaultCustomerId?: string
  leads: { id: string; name: string; phone?: string; address?: string; city?: string }[]
  customers: { id: string; name: string; phone?: string; address?: string; city?: string }[]
  onSubmit: (input: CreateQuoteInput) => Promise<{ error?: string; id?: string }>
  initialData?: Partial<QuoteFormData & { items: QuoteFormData['items'] }>
  submitLabel?: string
  redirectTo?: string
}

export function QuoteForm({
  defaultLeadId,
  defaultCustomerId,
  leads,
  customers,
  onSubmit,
  initialData,
  submitLabel = 'Create Quote',
  redirectTo,
}: QuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPricingHelper, setShowPricingHelper] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      lead_id: defaultLeadId ?? initialData?.lead_id ?? '',
      customer_id: defaultCustomerId ?? initialData?.customer_id ?? '',
      service_type: initialData?.service_type ?? '',
      description: initialData?.description ?? '',
      quote_amount: initialData?.quote_amount ?? 0,
      discount_amount: initialData?.discount_amount ?? 0,
      final_amount: initialData?.final_amount ?? 0,
      valid_until: initialData?.valid_until ?? '',
      follow_up_date: initialData?.follow_up_date ?? '',
      items: initialData?.items ?? [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const items = watch('items') ?? []
  const discountAmount = watch('discount_amount') ?? 0
  const serviceType = watch('service_type')

  // Recalculate totals whenever items or discount change
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)
    setValue('quote_amount', subtotal)
    setValue('final_amount', Math.max(0, subtotal - Number(discountAmount)))
  }, [JSON.stringify(items), discountAmount, setValue])

  // Recalculate line total when qty/price changes
  function recalcItem(index: number) {
    const qty = Number(watch(`items.${index}.quantity`) ?? 1)
    const price = Number(watch(`items.${index}.unit_price`) ?? 0)
    setValue(`items.${index}.total_price`, qty * price)
  }

  const pricingSuggestion = PRICING_SUGGESTIONS.find(
    (p) => serviceType && p.service.toLowerCase().includes(serviceType.toLowerCase().split(' ')[0])
  )

  async function handleFormSubmit(data: QuoteFormData) {
    setLoading(true)
    setServerError('')
    const result = await onSubmit({
      lead_id: data.lead_id || undefined,
      customer_id: data.customer_id || undefined,
      service_type: data.service_type,
      description: data.description || undefined,
      quote_amount: data.quote_amount,
      discount_amount: data.discount_amount,
      final_amount: data.final_amount,
      valid_until: data.valid_until || undefined,
      follow_up_date: data.follow_up_date || undefined,
      items: data.items?.map((item) => ({
        service_name: item.service_name,
        description: item.description || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
    })
    if (result.error) {
      setServerError(result.error)
      setLoading(false)
    } else {
      router.push(redirectTo ?? (result.id ? `/quotes/${result.id}` : '/quotes'))
    }
  }

  const subtotal = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)
  const finalAmount = Math.max(0, subtotal - Number(discountAmount))

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {serverError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {serverError}
        </div>
      )}

      {/* For */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Quote For</h2>
        <div className="grid sm:grid-cols-2 gap-4">
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
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <SelectValue placeholder="Select lead (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-gray-400">Select either a customer or a lead, not both.</p>
        {/* Homeowner contact info — shown when a customer or lead is selected */}
        {(() => {
          const cid = watch('customer_id')
          const lid = watch('lead_id')
          const contact = cid ? customers.find(c => c.id === cid) : lid ? leads.find(l => l.id === lid) : null
          if (!contact) return null
          return (
            <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 space-y-1 text-sm">
              <p className="font-semibold text-gray-800">{contact.name}</p>
              {contact.phone && <p className="text-gray-600">{contact.phone}</p>}
              {(contact.address || contact.city) && (
                <p className="text-gray-500">{[contact.address, contact.city].filter(Boolean).join(', ')}</p>
              )}
            </div>
          )
        })()}
      </div>

      {/* Service */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Service Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Service Type *</Label>
            <Select value={serviceType} onValueChange={(v) => setValue('service_type', v)}>
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
            <Label>Valid Until</Label>
            <Input type="date" {...register('valid_until')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description / Notes</Label>
          <Textarea rows={3} placeholder="Scope of work, special instructions..." {...register('description')} />
        </div>

        {pricingSuggestion && (
          <button
            type="button"
            onClick={() => setShowPricingHelper(!showPricingHelper)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            {showPricingHelper ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Pricing guide for {pricingSuggestion.service}
          </button>
        )}
        {showPricingHelper && pricingSuggestion && (
          <div className="text-sm bg-blue-50 border border-blue-100 rounded-md px-4 py-3 text-blue-800">
            Typical range: {formatCurrency(pricingSuggestion.min)} – {formatCurrency(pricingSuggestion.max)}
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Line Items</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ service_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 })}
          >
            <Plus className="w-3 h-3 mr-1" />Add Line
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No line items. Add items or enter a total amount below.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  <Label className="text-xs">Service</Label>
                  <Input
                    placeholder="e.g. House Washing"
                    {...register(`items.${index}.service_name`)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-12 sm:col-span-3 space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="Optional"
                    {...register(`items.${index}.description`)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-4 sm:col-span-1 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    {...register(`items.${index}.quantity`)}
                    onChange={(e) => { register(`items.${index}.quantity`).onChange(e); recalcItem(index) }}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...register(`items.${index}.unit_price`)}
                    onChange={(e) => { register(`items.${index}.unit_price`).onChange(e); recalcItem(index) }}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 space-y-1">
                  <Label className="text-xs">Total</Label>
                  <p className="text-sm font-medium pt-1.5">
                    {formatCurrency(Number(watch(`items.${index}.total_price`) ?? 0))}
                  </p>
                </div>
                <div className="col-span-1 flex items-end pb-0.5 justify-end">
                  <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500 mt-6">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <Label className="text-gray-600">Discount</Label>
            <div className="w-32">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register('discount_amount')}
                className="h-8 text-sm text-right"
              />
            </div>
          </div>
          {items.length === 0 && (
            <div className="flex items-center justify-between text-sm">
              <Label className="text-gray-600">Quote Amount (manual)</Label>
              <div className="w-32">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register('quote_amount')}
                  className="h-8 text-sm text-right"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between font-semibold text-base border-t pt-2">
            <span>Total</span>
            <span className="text-green-700">{formatCurrency(items.length > 0 ? finalAmount : Number(watch('quote_amount') ?? 0) - Number(discountAmount))}</span>
          </div>
        </div>
      </div>

      {/* Scheduling */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Follow Up</h2>
        <div className="space-y-1.5">
          <Label>Follow Up Date</Label>
          <Input type="date" {...register('follow_up_date')} className="max-w-xs" />
          <p className="text-xs text-gray-400">Leave blank — a follow-up task is auto-created when the quote is marked sent.</p>
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

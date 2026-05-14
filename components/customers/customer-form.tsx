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
import { customerSchema, type CustomerFormData } from '@/lib/validations/customer'
import type { Customer } from '@/types/crm'

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (data: FormData) => Promise<{ error?: string; id?: string }>
  submitLabel?: string
}

export function CustomerForm({ customer, onSubmit, submitLabel = 'Save Customer' }: CustomerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      address: customer?.address ?? '',
      city: customer?.city ?? '',
      state: customer?.state ?? 'VA',
      zip_code: customer?.zip_code ?? '',
      customer_type: customer?.customer_type ?? 'residential',
      notes: customer?.notes ?? '',
    },
  })

  const handleFormSubmit = async (data: CustomerFormData) => {
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') formData.append(k, String(v))
      })
      const result = await onSubmit(formData)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: customer ? 'Customer updated' : 'Customer created' })
        if (result.id) router.push(`/customers/${result.id}`)
        else router.back()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Contact Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
            <Input id="name" placeholder="John Smith" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
            <Input id="phone" type="tel" placeholder="(703) 555-0000" {...register('phone')} />
            {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Type</Label>
            <Select value={watch('customer_type')} onValueChange={(v) => setValue('customer_type', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

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
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" defaultValue="VA" {...register('state')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip_code">Zip</Label>
              <Input id="zip_code" placeholder="22033" {...register('zip_code')} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Notes</h2>
        <Textarea placeholder="Any notes about this customer..." rows={4} {...register('notes')} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none">
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SettingsInput } from '@/lib/actions/settings'

interface SettingsFormProps {
  settings: Record<string, any> | null
  onSubmit: (input: SettingsInput) => Promise<{ error?: string }>
}

export function SettingsForm({ settings, onSubmit }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    const form = e.currentTarget
    const data = new FormData(form)

    const result = await onSubmit({
      company_name: data.get('company_name') as string,
      company_phone: data.get('company_phone') as string,
      company_email: data.get('company_email') as string,
      company_address: data.get('company_address') as string,
      service_area: data.get('service_area') as string,
      google_review_link: data.get('google_review_link') as string,
      default_quote_expiration_days: Number(data.get('default_quote_expiration_days')) || 14,
      default_follow_up_days: Number(data.get('default_follow_up_days')) || 1,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3">Settings saved.</div>
      )}

      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Company Info</h2>
        <div className="space-y-1.5">
          <Label>Company Name</Label>
          <Input name="company_name" defaultValue={settings?.company_name ?? 'Crystal Pro Powerwashing'} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input name="company_phone" defaultValue={settings?.company_phone ?? ''} placeholder="(703) 555-0100" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="company_email" type="email" defaultValue={settings?.company_email ?? ''} placeholder="info@crystalpropowerwashing.com" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input name="company_address" defaultValue={settings?.company_address ?? ''} placeholder="Northern Virginia" />
        </div>
        <div className="space-y-1.5">
          <Label>Service Area</Label>
          <Input name="service_area" defaultValue={settings?.service_area ?? 'Northern Virginia'} placeholder="Northern Virginia" />
        </div>
      </div>

      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Review Settings</h2>
        <div className="space-y-1.5">
          <Label>Google Review Link</Label>
          <Input
            name="google_review_link"
            defaultValue={settings?.google_review_link ?? ''}
            placeholder="https://g.page/r/..."
          />
          <p className="text-xs text-gray-400">Used when sending review request messages to customers.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Defaults</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Quote Expiration (days)</Label>
            <Input
              name="default_quote_expiration_days"
              type="number"
              min="1"
              defaultValue={settings?.default_quote_expiration_days ?? 14}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Follow-up After Quote (days)</Label>
            <Input
              name="default_follow_up_days"
              type="number"
              min="1"
              defaultValue={settings?.default_follow_up_days ?? 1}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  )
}

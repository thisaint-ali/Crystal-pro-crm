'use client'

import { useState } from 'react'

const SERVICES = [
  'House Washing',
  'Driveway Cleaning',
  'Deck/Patio Cleaning',
  'Roof Cleaning',
  'Fence Cleaning',
  'Commercial Pressure Washing',
  'Other',
]

export default function EmbedLeadForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError('')

    const form = e.currentTarget
    const data: Record<string, string> = {}
    new FormData(form).forEach((v, k) => { data[k] = v.toString() })

    try {
      // Same-origin request — no secret needed
      const res = await fetch('/api/webhook/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Submission failed')
      }

      setStatus('success')
      form.reset()
    } catch (err: any) {
      setStatus('error')
      setError(err.message ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: 480,
      margin: '0 auto',
      padding: '24px 20px',
      background: '#fff',
    }}>
      {status === 'success' ? (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 12,
          padding: '32px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', color: '#166534', fontSize: 20, fontWeight: 700 }}>
            Request Received!
          </h2>
          <p style={{ margin: 0, color: '#15803d', fontSize: 15 }}>
            We'll get back to you within 24 hours.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#111' }}>
            Get a Free Quote
          </h2>

          <Field label="Full Name" required>
            <input name="name" type="text" required placeholder="John Smith" style={inputStyle} />
          </Field>

          <Field label="Phone Number" required>
            <input name="phone" type="tel" required placeholder="(703) 555-0123" style={inputStyle} />
          </Field>

          <Field label="Email Address">
            <input name="email" type="email" placeholder="john@example.com" style={inputStyle} />
          </Field>

          <Field label="Service Address">
            <input name="address" type="text" placeholder="123 Main St, Springfield, VA" style={inputStyle} />
          </Field>

          <Field label="Service Needed">
            <select name="service" style={inputStyle}>
              <option value="">Select a service...</option>
              {SERVICES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Additional Notes">
            <textarea
              name="notes"
              rows={3}
              placeholder="Any details about your project..."
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </Field>

          {status === 'error' && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              color: '#dc2626',
              fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              width: '100%',
              padding: '14px',
              background: status === 'sending' ? '#93c5fd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: status === 'sending' ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {status === 'sending' ? 'Sending...' : 'Request Free Quote →'}
          </button>

          <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            We respect your privacy. No spam, ever.
          </p>
        </form>
      )}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 15,
  color: '#111',
  background: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
}

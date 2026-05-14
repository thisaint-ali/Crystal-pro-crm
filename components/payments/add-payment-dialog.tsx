'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PAYMENT_METHODS } from '@/lib/constants'
import { addPayment } from '@/lib/actions/payments'

interface Props {
  jobId: string
  jobNumber: string
  amount: number
  customerId?: string
}

export function AddPaymentDialog({ jobId, jobNumber, amount, customerId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState('cash')
  const [paymentAmount, setPaymentAmount] = useState(amount.toString())
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await addPayment({
      job_id: jobId,
      customer_id: customerId,
      amount: Number(paymentAmount),
      payment_method: method,
      notes: notes || undefined,
    })
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <DollarSign className="w-3 h-3 mr-1" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment — {jobNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. check #1234" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

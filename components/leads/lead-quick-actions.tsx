'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, MessageSquare, Mail, FileText, Briefcase, UserCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { convertLeadToCustomer } from '@/lib/actions/leads'
import { buildCallUrl, buildSmsUrl, buildEmailUrl } from '@/lib/utils'
import type { Lead } from '@/types/crm'

interface LeadQuickActionsProps {
  lead: Lead
  existingCustomerId?: string
}

export function LeadQuickActions({ lead, existingCustomerId }: LeadQuickActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleConvert = () => {
    startTransition(async () => {
      const result = await convertLeadToCustomer(lead.id)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Customer created!' })
        router.push(`/customers/${result.customerId}`)
      }
    })
  }

  return (
    <div className="space-y-2">
      <a href={buildCallUrl(lead.phone)} className="block">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Phone className="w-4 h-4 mr-2 text-green-600" />
          Call
        </Button>
      </a>

      <a href={buildSmsUrl(lead.phone)} className="block">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
          Text
        </Button>
      </a>

      {lead.email && (
        <a href={buildEmailUrl(lead.email)} className="block">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Mail className="w-4 h-4 mr-2 text-purple-600" />
            Email
          </Button>
        </a>
      )}

      <Link href={`/quotes/new?lead_id=${lead.id}`}>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <FileText className="w-4 h-4 mr-2 text-indigo-600" />
          Create Quote
        </Button>
      </Link>

      <Link href={`/jobs/new?lead_id=${lead.id}`}>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Briefcase className="w-4 h-4 mr-2 text-orange-600" />
          Book Job
        </Button>
      </Link>

      {existingCustomerId ? (
        <Link href={`/customers/${existingCustomerId}`}>
          <Button variant="outline" size="sm" className="w-full justify-start text-green-700">
            <UserCheck className="w-4 h-4 mr-2" />
            View Customer
          </Button>
        </Link>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={handleConvert}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <UserCheck className="w-4 h-4 mr-2 text-green-600" />
          )}
          Convert to Customer
        </Button>
      )}
    </div>
  )
}

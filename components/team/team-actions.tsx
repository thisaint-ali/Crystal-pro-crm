'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ROLES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export function TeamActions({
  memberId,
  currentRole,
  isActive,
}: {
  memberId: string
  currentRole: string
  isActive: boolean
}) {
  const router = useRouter()
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  async function updateRole(newRole: string) {
    setRole(newRole)
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ role: newRole }).eq('id', memberId)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ active: !isActive }).eq('id', memberId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={updateRole} disabled={loading}>
        <SelectTrigger className="h-7 text-xs w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        disabled={loading}
        onClick={toggleActive}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </Button>
    </div>
  )
}

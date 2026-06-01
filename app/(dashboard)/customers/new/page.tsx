import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { CustomerForm } from '@/components/customers/customer-form'
import { createCustomer } from '@/lib/actions/customers'

export default async function NewCustomerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <PageHeader title="New Customer" backHref="/customers" backLabel="Customers" />
      <CustomerForm onSubmit={createCustomer} submitLabel="Create Customer" />
    </div>
  )
}

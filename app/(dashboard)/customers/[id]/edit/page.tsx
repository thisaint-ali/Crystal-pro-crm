import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { CustomerForm } from '@/components/customers/customer-form'
import { updateCustomer } from '@/lib/actions/customers'

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'manager'].includes(profile.role)) redirect('/dashboard')

  const { data: customer } = await db.from('customers').select('*').eq('id', id).single()
  if (!customer) notFound()

  const db = createServiceClient()
  const updateAction = async (formData: FormData) => {
    'use server'
    return updateCustomer(id, formData)
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      <PageHeader title="Edit Customer" backHref={`/customers/${id}`} backLabel={customer.name} />
      <CustomerForm customer={customer as any} onSubmit={updateAction} submitLabel="Save Changes" />
    </div>
  )
}

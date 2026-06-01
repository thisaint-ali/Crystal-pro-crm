import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TeamActions } from '@/components/team/team-actions'
import { formatDate } from '@/lib/utils'
import { ROLES } from '@/lib/constants'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const db = createServiceClient()
  const { data: members } = await db
    .from('profiles')
    .select('*')
    .order('created_at')

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 text-sm mt-1">{members?.length ?? 0} members</p>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members?.map((member: any) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{member.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{member.email}</td>
                <td className="px-4 py-3 capitalize">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    member.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${member.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {member.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(member.created_at)}</td>
                <td className="px-4 py-3">
                  {member.id !== user.id && (
                    <TeamActions memberId={member.id} currentRole={member.role} isActive={member.active} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">Adding team members</p>
        <p>New users sign up at the login page using their company email. Their account starts inactive — activate them and assign a role here.</p>
      </div>
    </div>
  )
}

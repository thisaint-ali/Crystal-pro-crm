import { Bell } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types/crm'

interface HeaderProps {
  profile: Profile | null
  title?: string
}

export function Header({ profile, title }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 hidden lg:block">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{profile?.full_name}</span>
          <span className="text-gray-400">·</span>
          <span className="capitalize text-gray-500">{profile?.role}</span>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
            {getInitials(profile?.full_name)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

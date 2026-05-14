'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FileText,
  Briefcase,
  Calendar,
  CheckSquare,
  DollarSign,
  Star,
  Users2,
  Settings,
  LogOut,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { isAdmin, isManager } from '@/lib/auth/permissions'
import type { Profile } from '@/types/crm'

const ICON_MAP = {
  LayoutDashboard,
  UserPlus,
  Users,
  FileText,
  Briefcase,
  Calendar,
  CheckSquare,
  DollarSign,
  Star,
  Users2,
  Settings,
} as const

interface NavItem {
  href: string
  label: string
  icon: keyof typeof ICON_MAP
}

function getNavItems(role: string): NavItem[] {
  const base: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/jobs', label: 'Jobs', icon: 'Briefcase' },
    { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
  ]

  if (isAdmin(role as any) || isManager(role as any)) {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/leads', label: 'Leads', icon: 'UserPlus' },
      { href: '/customers', label: 'Customers', icon: 'Users' },
      { href: '/quotes', label: 'Quotes', icon: 'FileText' },
      { href: '/jobs', label: 'Jobs', icon: 'Briefcase' },
      { href: '/calendar', label: 'Calendar', icon: 'Calendar' },
      { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
      { href: '/payments', label: 'Payments', icon: 'DollarSign' },
      { href: '/reviews', label: 'Reviews', icon: 'Star' },
      ...(isAdmin(role as any)
        ? ([
            { href: '/team', label: 'Team', icon: 'Users2' },
            { href: '/settings', label: 'Settings', icon: 'Settings' },
          ] as NavItem[])
        : []),
    ]
  }

  return base
}

interface SidebarProps {
  profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = getNavItems(profile?.role ?? 'worker')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900 text-white border-r border-slate-800">
      {/* Logo */}
      <div className="p-4 border-b border-slate-800">
        <Image src="/logo.png" alt="Crystal Pro Powerwashing" width={180} height={90} className="w-full object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon]
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">
              {profile?.full_name ?? 'User'}
            </p>
            <p className="text-xs text-slate-400 capitalize">{profile?.role ?? 'worker'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  X,
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

interface MobileNavProps {
  profile: Profile | null
}

export function MobileNav({ profile }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const navItems = getNavItems(profile?.role ?? 'worker')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white border-b border-slate-800 h-14 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Image src="/logo.png" alt="Crystal Pro" width={120} height={60} className="object-contain" />
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Image src="/logo.png" alt="Crystal Pro" width={140} height={70} className="object-contain" />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
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
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name ?? 'User'}</p>
              <p className="text-xs text-slate-400 capitalize">{profile?.role ?? 'worker'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

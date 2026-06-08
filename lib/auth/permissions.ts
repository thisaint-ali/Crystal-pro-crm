import type { UserRole } from '@/types/crm'

// Role hierarchy: admin > d2d_rep > technician
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  d2d_rep: 2,
  technician: 1,
}

export function hasRole(userRole: UserRole | null | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin'
}

/** D2D Rep has manager-level access (minus money/delete/settings) */
export function isD2DRep(role: UserRole | null | undefined): boolean {
  return role === 'd2d_rep' || role === 'admin'
}

/** @deprecated use isD2DRep */
export function isManager(role: UserRole | null | undefined): boolean {
  return isD2DRep(role)
}

export function isTechnician(role: UserRole | null | undefined): boolean {
  return role === 'technician'
}

export const PERMISSIONS = {
  // Lead permissions
  leads: {
    view: (role: UserRole) => hasRole(role, 'technician'),
    viewAll: (role: UserRole) => hasRole(role, 'd2d_rep'),
    create: (role: UserRole) => hasRole(role, 'd2d_rep'),
    edit: (role: UserRole) => hasRole(role, 'd2d_rep'),
    delete: (role: UserRole) => isAdmin(role),
    assign: (role: UserRole) => hasRole(role, 'd2d_rep'),
  },
  // Customer permissions
  customers: {
    view: (role: UserRole) => hasRole(role, 'd2d_rep'),
    create: (role: UserRole) => hasRole(role, 'd2d_rep'),
    edit: (role: UserRole) => hasRole(role, 'd2d_rep'),
    delete: (role: UserRole) => isAdmin(role),
  },
  // Quote permissions
  quotes: {
    view: (role: UserRole) => hasRole(role, 'd2d_rep'),
    create: (role: UserRole) => hasRole(role, 'd2d_rep'),
    edit: (role: UserRole) => hasRole(role, 'd2d_rep'),
    delete: (role: UserRole) => isAdmin(role),
    markSent: (role: UserRole) => hasRole(role, 'd2d_rep'),
    markAccepted: (role: UserRole) => hasRole(role, 'd2d_rep'),
    markDeclined: (role: UserRole) => hasRole(role, 'd2d_rep'),
    convertToJob: (role: UserRole) => hasRole(role, 'd2d_rep'),
  },
  // Job permissions
  jobs: {
    viewAll: (role: UserRole) => hasRole(role, 'd2d_rep'),
    viewAssigned: (role: UserRole) => hasRole(role, 'technician'),
    create: (role: UserRole) => hasRole(role, 'd2d_rep'),
    edit: (role: UserRole) => hasRole(role, 'd2d_rep'),
    editStatus: (role: UserRole) => hasRole(role, 'technician'),
    editPrice: (role: UserRole) => isAdmin(role),
    delete: (role: UserRole) => isAdmin(role),
    assign: (role: UserRole) => hasRole(role, 'd2d_rep'),
    markPaid: (role: UserRole) => isAdmin(role),
    cancel: (role: UserRole) => hasRole(role, 'd2d_rep'),
  },
  // Photo permissions
  photos: {
    upload: (role: UserRole) => hasRole(role, 'technician'),
    delete: (role: UserRole) => hasRole(role, 'd2d_rep'),
  },
  // Task permissions
  tasks: {
    viewAll: (role: UserRole) => hasRole(role, 'd2d_rep'),
    viewAssigned: (role: UserRole) => hasRole(role, 'technician'),
    create: (role: UserRole) => hasRole(role, 'd2d_rep'),
    edit: (role: UserRole) => hasRole(role, 'd2d_rep'),
    complete: (role: UserRole) => hasRole(role, 'technician'),
    delete: (role: UserRole) => isAdmin(role),
  },
  // Payment permissions — admin only (D2D rep cannot see money)
  payments: {
    view: (role: UserRole) => isAdmin(role),
    create: (role: UserRole) => isAdmin(role),
    delete: (role: UserRole) => isAdmin(role),
  },
  // Review permissions
  reviews: {
    view: (role: UserRole) => hasRole(role, 'd2d_rep'),
    request: (role: UserRole) => hasRole(role, 'd2d_rep'),
    markComplete: (role: UserRole) => hasRole(role, 'd2d_rep'),
  },
  // Team permissions
  team: {
    view: (role: UserRole) => isAdmin(role),
    manage: (role: UserRole) => isAdmin(role),
    changeRoles: (role: UserRole) => isAdmin(role),
    deactivate: (role: UserRole) => isAdmin(role),
  },
  // Settings permissions
  settings: {
    view: (role: UserRole) => isAdmin(role),
    edit: (role: UserRole) => isAdmin(role),
  },
  // Dashboard permissions
  dashboard: {
    viewRevenue: (role: UserRole) => isAdmin(role),   // D2D rep cannot see money
    viewFullAnalytics: (role: UserRole) => hasRole(role, 'd2d_rep'),
    viewWorkerView: (role: UserRole) => hasRole(role, 'technician'),
  },
  // Notes permissions
  notes: {
    view: (role: UserRole) => hasRole(role, 'technician'),
    create: (role: UserRole) => hasRole(role, 'technician'),
    delete: (role: UserRole) => hasRole(role, 'd2d_rep'),
  },
}

// Navigation items visible by role
export function getNavItems(role: UserRole | null | undefined) {
  if (!role) return []

  const baseItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/jobs', label: 'Jobs', icon: 'Briefcase' },
    { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
  ]

  if (isAdmin(role) || isD2DRep(role)) {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/leads', label: 'Leads', icon: 'UserPlus' },
      { href: '/customers', label: 'Customers', icon: 'Users' },
      { href: '/quotes', label: 'Quotes', icon: 'FileText' },
      { href: '/jobs', label: 'Jobs', icon: 'Briefcase' },
      { href: '/calendar', label: 'Calendar', icon: 'Calendar' },
      { href: '/map', label: 'Map', icon: 'Map' },
      { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
      { href: '/reviews', label: 'Reviews', icon: 'Star' },
      ...(isAdmin(role)
        ? [
            { href: '/payments', label: 'Payments', icon: 'DollarSign' },
            { href: '/team', label: 'Team', icon: 'Users2' },
            { href: '/settings', label: 'Settings', icon: 'Settings' },
          ]
        : []),
    ]
  }

  return baseItems
}

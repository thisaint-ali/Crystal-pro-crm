import type { UserRole } from '@/types/crm'

// Role hierarchy: admin > manager > worker
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  worker: 1,
}

export function hasRole(userRole: UserRole | null | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin'
}

export function isManager(role: UserRole | null | undefined): boolean {
  return role === 'manager' || role === 'admin'
}

export function isWorker(role: UserRole | null | undefined): boolean {
  return role === 'worker'
}

export const PERMISSIONS = {
  // Lead permissions
  leads: {
    view: (role: UserRole) => hasRole(role, 'worker'),
    viewAll: (role: UserRole) => hasRole(role, 'manager'),
    create: (role: UserRole) => hasRole(role, 'manager'),
    edit: (role: UserRole) => hasRole(role, 'manager'),
    delete: (role: UserRole) => isAdmin(role),
    assign: (role: UserRole) => hasRole(role, 'manager'),
  },
  // Customer permissions
  customers: {
    view: (role: UserRole) => hasRole(role, 'manager'),
    create: (role: UserRole) => hasRole(role, 'manager'),
    edit: (role: UserRole) => hasRole(role, 'manager'),
    delete: (role: UserRole) => isAdmin(role),
  },
  // Quote permissions
  quotes: {
    view: (role: UserRole) => hasRole(role, 'manager'),
    create: (role: UserRole) => hasRole(role, 'manager'),
    edit: (role: UserRole) => hasRole(role, 'manager'),
    delete: (role: UserRole) => isAdmin(role),
    markSent: (role: UserRole) => hasRole(role, 'manager'),
    markAccepted: (role: UserRole) => hasRole(role, 'manager'),
    markDeclined: (role: UserRole) => hasRole(role, 'manager'),
    convertToJob: (role: UserRole) => hasRole(role, 'manager'),
  },
  // Job permissions
  jobs: {
    viewAll: (role: UserRole) => hasRole(role, 'manager'),
    viewAssigned: (role: UserRole) => hasRole(role, 'worker'),
    create: (role: UserRole) => hasRole(role, 'manager'),
    edit: (role: UserRole) => hasRole(role, 'manager'),
    editStatus: (role: UserRole) => hasRole(role, 'worker'),
    editPrice: (role: UserRole) => hasRole(role, 'manager'),
    delete: (role: UserRole) => isAdmin(role),
    assign: (role: UserRole) => hasRole(role, 'manager'),
    markPaid: (role: UserRole) => hasRole(role, 'manager'),
    cancel: (role: UserRole) => hasRole(role, 'manager'),
  },
  // Photo permissions
  photos: {
    upload: (role: UserRole) => hasRole(role, 'worker'),
    delete: (role: UserRole) => hasRole(role, 'manager'),
  },
  // Task permissions
  tasks: {
    viewAll: (role: UserRole) => hasRole(role, 'manager'),
    viewAssigned: (role: UserRole) => hasRole(role, 'worker'),
    create: (role: UserRole) => hasRole(role, 'manager'),
    edit: (role: UserRole) => hasRole(role, 'manager'),
    complete: (role: UserRole) => hasRole(role, 'worker'),
    delete: (role: UserRole) => isAdmin(role),
  },
  // Payment permissions
  payments: {
    view: (role: UserRole) => hasRole(role, 'manager'),
    create: (role: UserRole) => hasRole(role, 'manager'),
    delete: (role: UserRole) => isAdmin(role),
  },
  // Review permissions
  reviews: {
    view: (role: UserRole) => hasRole(role, 'manager'),
    request: (role: UserRole) => hasRole(role, 'manager'),
    markComplete: (role: UserRole) => hasRole(role, 'manager'),
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
    viewRevenue: (role: UserRole) => hasRole(role, 'manager'),
    viewFullAnalytics: (role: UserRole) => hasRole(role, 'manager'),
    viewWorkerView: (role: UserRole) => hasRole(role, 'worker'),
  },
  // Notes permissions
  notes: {
    view: (role: UserRole) => hasRole(role, 'worker'),
    create: (role: UserRole) => hasRole(role, 'worker'),
    delete: (role: UserRole) => hasRole(role, 'manager'),
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

  if (isAdmin(role) || isManager(role)) {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/leads', label: 'Leads', icon: 'UserPlus' },
      { href: '/customers', label: 'Customers', icon: 'Users' },
      { href: '/quotes', label: 'Quotes', icon: 'FileText' },
      { href: '/jobs', label: 'Jobs', icon: 'Briefcase' },
      { href: '/calendar', label: 'Calendar', icon: 'Calendar' },
      { href: '/map', label: 'Map', icon: 'Map' },
      { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
      { href: '/payments', label: 'Payments', icon: 'DollarSign' },
      { href: '/reviews', label: 'Reviews', icon: 'Star' },
      ...(isAdmin(role)
        ? [
            { href: '/team', label: 'Team', icon: 'Users2' },
            { href: '/settings', label: 'Settings', icon: 'Settings' },
          ]
        : []),
    ]
  }

  return baseItems
}

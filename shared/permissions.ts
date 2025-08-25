// Permission constants for Enhanced Personas RBAC
export const PERMISSIONS = {
  // Builder permissions
  CREATE_PROJECTS: 'create_projects',
  VIEW_PROJECTS: 'view_projects',
  EDIT_PROJECTS: 'edit_projects',
  DELETE_PROJECTS: 'delete_projects',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_IMPLEMENTATIONS: 'manage_implementations',
  PURCHASE_TEMPLATES: 'purchase_templates',

  // End-user permissions
  PURCHASE_WIDGETS: 'purchase_widgets',
  MANAGE_WIDGETS: 'manage_widgets',
  VIEW_USAGE: 'view_usage',
  MANAGE_BILLING: 'manage_billing',

  // Admin permissions
  MANAGE_USERS: 'manage_users',
  VIEW_PLATFORM_ANALYTICS: 'view_platform_analytics',
  MANAGE_BUILDERS: 'manage_builders',
  VIEW_IMPLEMENTATIONS: 'view_implementations',
  MANAGE_SYSTEM: 'manage_system',
} as const;

// Role definitions
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BUILDER: 'builder',
  END_USER: 'end_user',
} as const;

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.BUILDER]: [
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_IMPLEMENTATIONS,
    PERMISSIONS.PURCHASE_TEMPLATES,
  ],
  [ROLES.END_USER]: [
    PERMISSIONS.PURCHASE_WIDGETS,
    PERMISSIONS.MANAGE_WIDGETS,
    PERMISSIONS.VIEW_USAGE,
    PERMISSIONS.MANAGE_BILLING,
  ],
};

// Permission checking utilities
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

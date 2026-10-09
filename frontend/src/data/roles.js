export const ROLE = Object.freeze({
  ADMIN: 'ADMIN',
  PROPERTY_MANAGER: 'PROPERTY_MANAGER',
  TENANT: 'TENANT',
  LANDLORD: 'landlord',
});

export const roleDashboardPath = {
  [ROLE.ADMIN]: '/dashboard/admin',
  [ROLE.PROPERTY_MANAGER]: '/dashboard/manager',
  [ROLE.TENANT]: '/dashboard/tenant',
  [ROLE.LANDLORD]: '/dashboard/landlord',
};

export function roleLabel(role) {
  return {
    [ROLE.ADMIN]: 'Admin',
    [ROLE.PROPERTY_MANAGER]: 'Property Manager',
    [ROLE.TENANT]: 'Tenant',
    [ROLE.LANDLORD]: 'Landlord',
  }[role] || 'Guest';
}

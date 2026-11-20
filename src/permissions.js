const ROLE_PERMISSIONS = Object.freeze({
  waiter: ["orders:create", "orders:read"],
  cashier: ["orders:read", "payments:create"],
  manager: ["orders:read", "reports:read"],
  admin: ["users:manage", "orders:read", "reports:read"]
});

function getPermissionsForRole(role) {
  if (!role || typeof role !== "string") return [];
  return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(role, permission) {
  return getPermissionsForRole(role).includes(permission);
}

module.exports = {
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission
};
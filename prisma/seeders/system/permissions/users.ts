export const userPermissions = [
  // =====================================================
  // USER MANAGEMENT
  // =====================================================

  {
    name: "users.view",
    module: "Users",
    description: "View users",
  },
  {
    name: "users.create",
    module: "Users",
    description: "Create users",
  },
  {
    name: "users.update",
    module: "Users",
    description: "Update users",
  },
  {
    name: "users.delete",
    module: "Users",
    description: "Delete users",
  },
  {
    name: "users.restore",
    module: "Users",
    description: "Restore deleted users",
  },
  {
    name: "users.archive",
    module: "Users",
    description: "Archive users",
  },
  {
    name: "users.search",
    module: "Users",
    description: "Search users",
  },
  {
    name: "users.export",
    module: "Users",
    description: "Export user data",
  },
  {
    name: "users.import",
    module: "Users",
    description: "Import users",
  },

  // =====================================================
  // PROFILE
  // =====================================================

  {
    name: "profile.view",
    module: "Users",
    description: "View own profile",
  },
  {
    name: "profile.update",
    module: "Users",
    description: "Update own profile",
  },
  {
    name: "profile.photo",
    module: "Users",
    description: "Change profile photo",
  },
  {
    name: "profile.password",
    module: "Users",
    description: "Change password",
  },

  // =====================================================
  // ROLES
  // =====================================================

  {
    name: "roles.view",
    module: "Users",
    description: "View roles",
  },
  {
    name: "roles.create",
    module: "Users",
    description: "Create roles",
  },
  {
    name: "roles.update",
    module: "Users",
    description: "Update roles",
  },
  {
    name: "roles.delete",
    module: "Users",
    description: "Delete roles",
  },
  {
    name: "roles.assign",
    module: "Users",
    description: "Assign roles to users",
  },

  // =====================================================
  // PERMISSIONS
  // =====================================================

  {
    name: "permissions.view",
    module: "Users",
    description: "View permissions",
  },
  {
    name: "permissions.create",
    module: "Users",
    description: "Create permissions",
  },
  {
    name: "permissions.update",
    module: "Users",
    description: "Update permissions",
  },
  {
    name: "permissions.delete",
    module: "Users",
    description: "Delete permissions",
  },
  {
    name: "permissions.assign",
    module: "Users",
    description: "Assign permissions to roles",
  },

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  {
    name: "auth.login",
    module: "Users",
    description: "Login",
  },
  {
    name: "auth.logout",
    module: "Users",
    description: "Logout",
  },
  {
    name: "auth.reset_password",
    module: "Users",
    description: "Reset password",
  },
  {
    name: "auth.verify_phone",
    module: "Users",
    description: "Verify phone number",
  },
  {
    name: "auth.verify_email",
    module: "Users",
    description: "Verify email address",
  },

  // =====================================================
  // ACCOUNT STATUS
  // =====================================================

  {
    name: "account.activate",
    module: "Users",
    description: "Activate account",
  },
  {
    name: "account.deactivate",
    module: "Users",
    description: "Deactivate account",
  },
  {
    name: "account.lock",
    module: "Users",
    description: "Lock account",
  },
  {
    name: "account.unlock",
    module: "Users",
    description: "Unlock account",
  },

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  {
    name: "sessions.view",
    module: "Users",
    description: "View active sessions",
  },
  {
    name: "sessions.terminate",
    module: "Users",
    description: "Terminate user sessions",
  },

  // =====================================================
  // AUDIT
  // =====================================================

  {
    name: "audit.user_activity",
    module: "Users",
    description: "View user activity logs",
  },
];





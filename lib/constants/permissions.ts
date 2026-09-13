/**
 * System permissions
 */

export const PERMISSIONS = {

  // Users
  CREATE_USER: "create:user",
  UPDATE_USER: "update:user",
  DELETE_USER: "delete:user",
  VIEW_USERS: "view:users",

  // Roles
  CREATE_ROLE: "create:role",
  UPDATE_ROLE: "update:role",
  DELETE_ROLE: "delete:role",
  VIEW_ROLES: "view:roles",

  // Farmers
  CREATE_FARMER: "create:farmer",
  UPDATE_FARMER: "update:farmer",
  DELETE_FARMER: "delete:farmer",
  VIEW_FARMERS: "view:farmers",

  // Farms
  CREATE_FARM: "create:farm",
  UPDATE_FARM: "update:farm",
  DELETE_FARM: "delete:farm",
  VIEW_FARMS: "view:farms",

  // Crops
  CREATE_CROP: "create:crop",
  UPDATE_CROP: "update:crop",
  DELETE_CROP: "delete:crop",
  VIEW_CROPS: "view:crops",

  // Livestock
  CREATE_LIVESTOCK: "create:livestock",
  UPDATE_LIVESTOCK: "update:livestock",
  DELETE_LIVESTOCK: "delete:livestock",
  VIEW_LIVESTOCK: "view:livestock",

  // Reports
  CREATE_REPORT: "create:report",
  VIEW_REPORTS: "view:reports",

  // Dashboard
  VIEW_DASHBOARD: "view:dashboard",

  // Administration
  SYSTEM_SETTINGS: "system:settings",

} as const;

export type Permission =
  typeof PERMISSIONS[keyof typeof PERMISSIONS];
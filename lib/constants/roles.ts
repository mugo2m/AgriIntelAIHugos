//=====================================================
// SYSTEM ROLES
//=====================================================

export const ROLES = {

  // Platform
  SUPER_ADMIN: "Super Admin",

  // Government
  NATIONAL_ADMIN: "National Admin",

  COUNTY_DIRECTOR: "County Director",

  SUB_COUNTY_OFFICER: "Sub County Officer",

  WARD_EXTENSION_OFFICER: "Ward Extension Officer",

  EXTENSION_OFFICER: "Extension Officer",

  // Farm
  FARM_OWNER: "Farm Owner",

  FARM_MANAGER: "Farm Manager",

  FARM_SUPERVISOR: "Farm Supervisor",

  FARM_WORKER: "Farm Worker",

  // Farmers
  FARMER: "Farmer",

  LEAD_FARMER: "Lead Farmer",

  // Livestock
  VETERINARY_OFFICER: "Veterinary Officer",

  // Business
  BUYER: "Buyer",

  CUSTOMER: "Customer",

  SUPPLIER: "Supplier",

  AGROVET: "Agrovet",

  TRANSPORTER: "Transporter",

  PROCESSOR: "Processor",

  EXPORTER: "Exporter",

  // Cooperatives
  COOPERATIVE_MANAGER: "Cooperative Manager",

  COOPERATIVE_MEMBER: "Cooperative Member",

  // Finance
  ACCOUNTANT: "Accountant",

  AUDITOR: "Auditor",

} as const;

//=====================================================
// TYPE
//=====================================================

export type UserRole =
  typeof ROLES[keyof typeof ROLES];
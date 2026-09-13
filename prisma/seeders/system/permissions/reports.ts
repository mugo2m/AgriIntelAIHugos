 // prisma/seeders/system/permissions/reports.ts

// =====================================================
// REPORTS & ANALYTICS PERMISSIONS
// =====================================================

export const reportPermissions = [
  // ===================================================
  // REPORTS
  // ===================================================

  {
    name: "reports.view",
    description: "View generated reports",
    module: "Reports",
  },

  {
    name: "reports.generate",
    description: "Generate reports",
    module: "Reports",
  },

  {
    name: "reports.export.pdf",
    description: "Export reports to PDF",
    module: "Reports",
  },

  {
    name: "reports.export.excel",
    description: "Export reports to Excel",
    module: "Reports",
  },

  {
    name: "reports.export.csv",
    description: "Export reports to CSV",
    module: "Reports",
  },

  {
    name: "reports.share",
    description: "Share reports",
    module: "Reports",
  },

  // ===================================================
  // DASHBOARDS
  // ===================================================

  {
    name: "dashboard.customize",
    description: "Customize dashboard",
    module: "Dashboard",
  },

  // ===================================================
  // ANALYTICS
  // ===================================================

  {
    name: "analytics.financial",
    description: "View financial analytics",
    module: "Analytics",
  },

  {
    name: "analytics.production",
    description: "View production analytics",
    module: "Analytics",
  },

  {
    name: "analytics.weather",
    description: "View weather analytics",
    module: "Analytics",
  },

  {
    name: "analytics.crop",
    description: "View crop analytics",
    module: "Analytics",
  },

  {
    name: "analytics.livestock",
    description: "View livestock analytics",
    module: "Analytics",
  },

  // ===================================================
  // FORECASTING
  // ===================================================

  {
    name: "forecast.download",
    description: "Download forecasts",
    module: "Forecasting",
  },

  // ===================================================
  // BUSINESS INTELLIGENCE
  // ===================================================

  {
    name: "bi.view",
    description: "Access Business Intelligence",
    module: "Business Intelligence",
  },

  {
    name: "bi.kpi",
    description: "View KPIs",
    module: "Business Intelligence",
  },

  {
    name: "bi.compare",
    description: "Compare historical performance",
    module: "Business Intelligence",
  },
];


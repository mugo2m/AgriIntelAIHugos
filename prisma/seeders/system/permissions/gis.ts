// prisma/seeders/system/permissions/gis.ts

// =====================================================
// GIS PERMISSIONS
// =====================================================

export const gisPermissions = [
  // ===================================================
  // Maps
  // ===================================================

  {
    name: "gis.maps.view",
    description: "View GIS maps",
    module: "GIS",
  },

  {
    name: "gis.maps.create",
    description: "Create GIS maps",
    module: "GIS",
  },

  {
    name: "gis.maps.edit",
    description: "Edit GIS maps",
    module: "GIS",
  },

  {
    name: "gis.maps.delete",
    description: "Delete GIS maps",
    module: "GIS",
  },

  // ===================================================
  // Farm Boundaries
  // ===================================================

  {
    name: "gis.farm_boundaries.view",
    description: "View farm boundaries",
    module: "GIS",
  },

  {
    name: "gis.farm_boundaries.edit",
    description: "Edit farm boundaries",
    module: "GIS",
  },

  // ===================================================
  // Satellite
  // ===================================================

  {
    name: "gis.satellite_images.view",
    description: "View satellite imagery",
    module: "GIS",
  },

  {
    name: "gis.satellite_analysis.request",
    description: "Request satellite analysis",
    module: "GIS",
  },

  // ===================================================
  // Spatial Layers
  // ===================================================

  {
    name: "gis.layers.view",
    description: "View GIS layers",
    module: "GIS",
  },

  {
    name: "gis.layers.create",
    description: "Create GIS layers",
    module: "GIS",
  },

  {
    name: "gis.layers.edit",
    description: "Edit GIS layers",
    module: "GIS",
  },

  {
    name: "gis.layers.delete",
    description: "Delete GIS layers",
    module: "GIS",
  },

  // ===================================================
  // Spatial Analysis
  // ===================================================

  {
    name: "gis.spatial_analysis.run",
    description: "Run spatial analysis",
    module: "GIS",
  },

  {
    name: "gis.data.export",
    description: "Export GIS datasets",
    module: "GIS",
  },

  // ===================================================
  // GIS Reports
  // ===================================================

  {
    name: "gis.reports.view",
    description: "View GIS reports",
    module: "GIS",
  },

  {
    name: "gis.reports.generate",
    description: "Generate GIS reports",
    module: "GIS",
  },
];
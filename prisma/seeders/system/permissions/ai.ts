// prisma/seeders/system/permissions/ai.ts

// =====================================================
// AI PERMISSIONS
// =====================================================

export const aiPermissions = [
  // ===================================================
  // AI Dashboard
  // ===================================================

  {
    name: "ai.dashboard.view",
    description: "View AI dashboard",
    module: "AI",
  },

  // ===================================================
  // AI Assistant
  // ===================================================

  {
    name: "ai.assistant.use",
    description: "Use AI assistant",
    module: "AI",
  },

  {
    name: "ai.chat.use",
    description: "Use AI chatbot",
    module: "AI",
  },

  {
    name: "ai.voice.use",
    description: "Use AI voice assistant",
    module: "AI",
  },

  // ===================================================
  // Decision Support
  // ===================================================

  {
    name: "ai.decision.view",
    description: "View AI decision support",
    module: "AI",
  },

  {
    name: "ai.decision.generate",
    description: "Generate AI decisions",
    module: "AI",
  },

  // ===================================================
  // Recommendations
  // ===================================================

  {
    name: "ai.recommendations.view",
    description: "View AI recommendations",
    module: "AI",
  },

  {
    name: "ai.recommendations.generate",
    description: "Generate AI recommendations",
    module: "AI",
  },

  {
    name: "ai.recommendations.approve",
    description: "Approve AI recommendations",
    module: "AI",
  },

  {
    name: "ai.recommendations.reject",
    description: "Reject AI recommendations",
    module: "AI",
  },

  // ===================================================
  // Crop Intelligence
  // ===================================================

  {
    name: "ai.crop.predict",
    description: "Predict crop performance",
    module: "AI",
  },

  {
    name: "ai.crop.yield",
    description: "Predict crop yield",
    module: "AI",
  },

  {
    name: "ai.crop.risk",
    description: "Predict crop risks",
    module: "AI",
  },

  // ===================================================
  // Soil Intelligence
  // ===================================================

  {
    name: "ai.soil.analysis",
    description: "AI soil analysis",
    module: "AI",
  },

  {
    name: "ai.soil.recommendation",
    description: "AI soil recommendations",
    module: "AI",
  },

  // ===================================================
  // Fertilizer Intelligence
  // ===================================================

  {
    name: "ai.fertilizer.recommend",
    description: "Recommend fertilizers",
    module: "AI",
  },

  // ===================================================
  // Weather Intelligence
  // ===================================================

  {
    name: "ai.weather.forecast",
    description: "Generate weather forecasts",
    module: "AI",
  },

  {
    name: "ai.weather.analysis",
    description: "Analyze weather patterns",
    module: "AI",
  },

  // ===================================================
  // Pest & Disease
  // ===================================================

  {
    name: "ai.pest.detect",
    description: "Detect pests",
    module: "AI",
  },

  {
    name: "ai.disease.detect",
    description: "Detect diseases",
    module: "AI",
  },

  {
    name: "ai.treatment.recommend",
    description: "Recommend treatments",
    module: "AI",
  },

  // ===================================================
  // Computer Vision
  // ===================================================

  {
    name: "ai.image.analyze",
    description: "Analyze uploaded images",
    module: "AI",
  },

  {
    name: "ai.drone.analyze",
    description: "Analyze drone imagery",
    module: "AI",
  },

  {
    name: "ai.satellite.analyze",
    description: "Analyze satellite imagery",
    module: "AI",
  },

  // ===================================================
  // Livestock AI
  // ===================================================

  {
    name: "ai.livestock.health",
    description: "Analyze livestock health",
    module: "AI",
  },

  {
    name: "ai.livestock.production",
    description: "Predict livestock production",
    module: "AI",
  },

  // ===================================================
  // Market Intelligence
  // ===================================================

  {
    name: "ai.market.forecast",
    description: "Forecast market trends",
    module: "AI",
  },

  {
    name: "ai.price.predict",
    description: "Predict commodity prices",
    module: "AI",
  },

  {
    name: "ai.demand.predict",
    description: "Predict market demand",
    module: "AI",
  },

  // ===================================================
  // Carbon & Sustainability
  // ===================================================

  {
    name: "ai.carbon.analysis",
    description: "Analyze carbon footprint",
    module: "AI",
  },

  {
    name: "ai.sustainability.score",
    description: "Generate sustainability scores",
    module: "AI",
  },

  // ===================================================
  // Machine Learning
  // ===================================================

  {
    name: "ai.models.view",
    description: "View AI models",
    module: "AI",
  },

  {
    name: "ai.models.train",
    description: "Train AI models",
    module: "AI",
  },

  {
    name: "ai.models.deploy",
    description: "Deploy AI models",
    module: "AI",
  },

  {
    name: "ai.models.monitor",
    description: "Monitor AI models",
    module: "AI",
  },

  // ===================================================
  // LLM
  // ===================================================

  {
    name: "ai.llm.use",
    description: "Use Large Language Models",
    module: "AI",
  },

  {
    name: "ai.llm.configure",
    description: "Configure AI models",
    module: "AI",
  },

  // ===================================================
  // Administration
  // ===================================================

  {
    name: "ai.admin",
    description: "Manage AI services",
    module: "AI",
  },
];
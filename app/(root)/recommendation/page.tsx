// app/(root)/recommendation/page.tsx – COMPLETE (crop + poultry + dairy + new feed formulation + new crop agents + poultry/dairy business plans)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOfflineTranslation } from "@/lib/hooks/useOfflineTranslation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RecommendationOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
  agents: string[];
  modules: string[];
  color: string;
  category?: "crops" | "poultry" | "dairy" | "both";
}

const OPTIONS: RecommendationOption[] = [
  // ============================================================
  // CROP OPTIONS
  // ============================================================
  {
    id: "fertilizer",
    label: "Fertilizer Recommendation",
    emoji: "🌱",
    description: "Personalized fertilizer plan based on your soil or extension advice",
    agents: ["EnterpriseSetupAgent", "FertilizerInterviewAgent"],
    modules: ["confidence", "fertilizer_plan", "soil_test", "planting_fertilizer", "topdressing_fertilizer", "business_tip", "fertilizer_remember", "reminder"],
    color: "from-green-500 to-emerald-600",
    category: "crops"
  },
  {
    id: "pest",
    label: "Pest Management",
    emoji: "🐛",
    description: "Identify pests and get control recommendations",
    agents: ["EnterpriseSetupAgent", "PestInterviewAgent"],
    modules: ["confidence", "pest_management", "plant_damage", "reminder"],
    color: "from-red-500 to-orange-600",
    category: "crops"
  },
  {
    id: "disease",
    label: "Disease Management",
    emoji: "🍄",
    description: "Identify diseases and get treatment options",
    agents: ["EnterpriseSetupAgent", "DiseaseInterviewAgent"],
    modules: ["confidence", "disease_management", "plant_damage", "reminder"],
    color: "from-purple-500 to-pink-600",
    category: "crops"
  },
  {
    id: "nutrient",
    label: "Nutrient Deficiency",
    emoji: "🔬",
    description: "Diagnose nutrient problems from symptoms",
    agents: ["EnterpriseSetupAgent", "NutrientInterviewAgent"],
    modules: ["confidence", "deficiency_analysis", "plant_damage", "reminder"],
    color: "from-blue-500 to-cyan-600",
    category: "crops"
  },
  {
    id: "financial",
    label: "Financial Analysis",
    emoji: "💰",
    description: "Gross margin, costs, and profit analysis",
    agents: ["EnterpriseSetupAgent", "GrossMarginInterviewAgent"],
    modules: ["confidence", "gross_margin", "farming_business", "reminder"],
    color: "from-amber-500 to-yellow-600",
    category: "crops"
  },
  {
    id: "conservation",
    label: "Soil & Water Conservation",
    emoji: "💧",
    description: "Conservation practices for your farm",
    agents: ["EnterpriseSetupAgent", "ConservationInterviewAgent"],
    modules: ["confidence", "conservation", "reminder"],
    color: "from-teal-500 to-green-600",
    category: "crops"
  },
  {
    id: "postharvest",
    label: "Post-Harvest Handling",
    emoji: "📦",
    description: "Storage, processing, and value addition",
    agents: ["EnterpriseSetupAgent", "StorageInterviewAgent"],
    modules: ["confidence", "post_harvest", "reminder"],
    color: "from-indigo-500 to-blue-600",
    category: "crops"
  },
  {
    id: "business",
    label: "Farming as a Business",
    emoji: "📈",
    description: "Business advice, marketing, and growth",
    agents: ["EnterpriseSetupAgent", "GAPInterviewAgent"],
    modules: ["confidence", "farming_business", "reminder"],
    color: "from-violet-500 to-purple-600",
    category: "crops"
  },
  {
    id: "nutrition",
    label: "Nutrition Benefits",
    emoji: "🥗",
    description: "Health and nutrition value of your crops",
    agents: ["EnterpriseSetupAgent"],
    modules: ["confidence", "nutrition_benefits", "reminder"],
    color: "from-rose-500 to-pink-600",
    category: "crops"
  },

  // ===== NEW CROP AGENTS (Added Today) =====
  {
    id: "crop_profit",
    label: "Crop Profit Calculation",
    emoji: "📊",
    description: "Calculate revenue, costs, gross margin, and ROI for your crop enterprise",
    agents: ["EnterpriseSetupAgent", "ProfitCalculationAgent"],
    modules: ["profit"],
    color: "from-emerald-500 to-green-600",
    category: "crops"
  },
  {
    id: "crop_gap",
    label: "Good Agricultural Practices (GAP)",
    emoji: "🌿",
    description: "Get crop‑specific best practices for planting, weeding, harvesting, and safety",
    agents: ["EnterpriseSetupAgent", "GAPAgent"],
    modules: ["gap"],
    color: "from-teal-500 to-cyan-600",
    category: "crops"
  },
  {
    id: "crop_business",
    label: "Crop Business Plan Generator",
    emoji: "📋",
    description: "Create a full business plan with vision, mission, goals, marketing, team, products, and production inputs",
    agents: ["EnterpriseSetupAgent", "BusinessPlanAgent"],
    modules: ["business"],
    color: "from-violet-500 to-purple-600",
    category: "crops"
  },

  // ---- UPDATED: Complete Farm Health Check now includes all crop agents and modules ----
  {
    id: "complete",
    label: "Complete Farm Health Check",
    emoji: "📋",
    description: "All recommendations in one comprehensive report",
    agents: [
      "EnterpriseSetupAgent",
      "GAPAgent",
      "ProfitCalculationAgent",
      "BusinessPlanAgent"
    ],
    modules: ["gap", "profit", "business", "complete"],
    color: "from-emerald-600 to-teal-700",
    category: "crops"
  },

  // ============================================================
  // POULTRY OPTIONS (existing + new feed formulation + poultry business plan)
  // ============================================================
  {
    id: "poultry_disease",
    label: "Poultry Disease Management",
    emoji: "🐔",
    description: "Identify poultry diseases and get treatment options (vaccination, antibiotics, biosecurity)",
    agents: ["PoultrySetupAgent", "PoultryDiseaseAgent"],
    modules: ["confidence", "poultry_disease_management", "bird_damage", "reminder"],
    color: "from-orange-500 to-red-600",
    category: "poultry"
  },
  {
    id: "poultry_health",
    label: "Complete Poultry Health Check",
    emoji: "🩺",
    description: "Full health assessment including diseases, parasites, nutrition, and financial analysis",
    agents: ["PoultrySetupAgent", "PoultryDiseaseAgent"],
    modules: ["confidence", "poultry_disease_management", "poultry_feed", "poultry_vaccination", "poultry_financial", "poultry_housing", "poultry_biosecurity", "poultry_breed_advice", "poultry_sourcing", "bird_damage", "reminder"],
    color: "from-amber-500 to-orange-600",
    category: "poultry"
  },
  {
    id: "poultry_feed",
    label: "Poultry Feed & Nutrition",
    emoji: "🍽️",
    description: "Get feed recommendations, protein requirements, and FCR advice for your birds",
    agents: ["PoultrySetupAgent"],
    modules: ["confidence", "poultry_feed", "reminder"],
    color: "from-green-500 to-teal-600",
    category: "poultry"
  },
  {
    id: "poultry_vaccination",
    label: "Poultry Vaccination Schedule",
    emoji: "💉",
    description: "Get a full vaccination schedule with costs and timing for your flock",
    agents: ["PoultrySetupAgent"],
    modules: ["confidence", "poultry_vaccination", "reminder"],
    color: "from-blue-500 to-cyan-600",
    category: "poultry"
  },
  {
    id: "poultry_financial",
    label: "Poultry Financial Analysis",
    emoji: "💰",
    description: "Calculate cost per bird, break-even prices, and profit margins",
    agents: ["PoultrySetupAgent", "GrossMarginInterviewAgent"],
    modules: ["confidence", "poultry_financial", "farming_business", "reminder"],
    color: "from-amber-500 to-yellow-600",
    category: "poultry"
  },
  {
    id: "poultry_housing",
    label: "Poultry Housing Advice",
    emoji: "🏠",
    description: "Get space requirements, ventilation, and equipment recommendations",
    agents: ["PoultrySetupAgent"],
    modules: ["confidence", "poultry_housing", "reminder"],
    color: "from-purple-500 to-indigo-600",
    category: "poultry"
  },
  {
    id: "poultry_biosecurity",
    label: "Poultry Biosecurity Checklist",
    emoji: "🧹",
    description: "Critical biosecurity steps to prevent disease outbreaks",
    agents: ["PoultrySetupAgent"],
    modules: ["confidence", "poultry_biosecurity", "reminder"],
    color: "from-red-500 to-rose-600",
    category: "poultry"
  },
  {
    id: "poultry_breed",
    label: "Poultry Breed Advice",
    emoji: "🐓",
    description: "Find the best breed for your climate, system, and farming goals",
    agents: ["PoultrySetupAgent"],
    modules: ["confidence", "poultry_breed_advice", "reminder"],
    color: "from-pink-500 to-rose-600",
    category: "poultry"
  },
  {
    id: "poultry_sourcing",
    label: "Hatchery & Sourcing",
    emoji: "📍",
    description: "Find hatcheries near you with prices and breed availability",
    agents: ["PoultrySetupAgent"],
    modules: ["confidence", "poultry_sourcing", "reminder"],
    color: "from-teal-500 to-cyan-600",
    category: "poultry"
  },
  // ---- NEW OPTION ----
  {
    id: "poultry_feed_formulation",
    label: "Home Poultry Feed Formulation",
    emoji: "⚖️",
    description: "Formulate a balanced feed using your local ingredients with automatic substitution and cost optimization",
    agents: ["HomePoultryFeedAgent"],
    modules: ["poultry_home_feed"],
    color: "from-green-500 to-teal-600",
    category: "poultry"
  },
  // ---- ADDED: Poultry Business Plan Generator ----
  {
    id: "poultry_business",
    label: "Poultry Business Plan Generator",
    emoji: "📋",
    description: "Create a full business plan with vision, mission, goals, marketing, team, products, and production inputs for your poultry enterprise",
    agents: ["PoultrySetupAgent", "PoultryBusinessPlanAgent"],
    modules: ["business"],
    color: "from-amber-500 to-orange-600",
    category: "poultry"
  },

  // ============================================================
  // DAIRY OPTIONS (all 15 agents + dairy business plan)
  // ============================================================
  {
    id: "dairy_health",
    label: "Dairy Health & Disease Management",
    emoji: "🐄",
    description: "Identify dairy diseases and get chemical, organic, and cultural treatment options",
    agents: ["DairySetupAgent", "DairyHealthAgent"],
    modules: ["confidence", "dairy_health_analysis", "dairy_financial", "dairy_management", "reminder"],
    color: "from-blue-500 to-cyan-600",
    category: "dairy"
  },
  {
    id: "dairy_breeding",
    label: "Dairy Breeding & Reproduction",
    emoji: "🧬",
    description: "Get advice on heat detection, insemination timing, and reproductive health",
    agents: ["DairySetupAgent", "DairyBreedingAgent"],
    modules: ["confidence", "dairy_breeding", "reminder"],
    color: "from-pink-500 to-rose-600",
    category: "dairy"
  },
  {
    id: "dairy_calf",
    label: "Dairy Calf Rearing",
    emoji: "🐄",
    description: "Colostrum management, feeding, housing, and health care for calves",
    agents: ["DairySetupAgent", "DairyCalfAgent"],
    modules: ["confidence", "dairy_calf", "reminder"],
    color: "from-green-500 to-emerald-600",
    category: "dairy"
  },
  {
    id: "dairy_concentrate",
    label: "Dairy Concentrate Formulation",
    emoji: "🧪",
    description: "Build a balanced concentrate mix with correct protein, energy, and minerals",
    agents: ["DairySetupAgent", "DairyConcentrateAgent"],
    modules: ["confidence", "dairy_concentrate", "reminder"],
    color: "from-purple-500 to-indigo-600",
    category: "dairy"
  },
  {
    id: "dairy_feed",
    label: "Dairy Feed Formulation (TMR)",
    emoji: "🌾",
    description: "Create a total mixed ration using your available forages, grains, proteins, and minerals",
    agents: ["DairySetupAgent", "DairyFeedAgent"],
    modules: ["confidence", "dairy_feed", "reminder"],
    color: "from-yellow-500 to-amber-600",
    category: "dairy"
  },
  {
    id: "dairy_feed_per_day",
    label: "Dairy Daily Feed Planning",
    emoji: "🍽️",
    description: "Plan daily forage and concentrate amounts based on milk yield",
    agents: ["DairySetupAgent", "DairyFeedPerDayAgent"],
    modules: ["confidence", "dairy_feed", "reminder"],
    color: "from-teal-500 to-cyan-600",
    category: "dairy"
  },
  {
    id: "dairy_financial",
    label: "Dairy Financial Analysis",
    emoji: "💰",
    description: "Calculate daily profit per cow, feed costs, and veterinary expenses",
    agents: ["DairySetupAgent", "DairyFinancialAgent"],
    modules: ["confidence", "dairy_financial", "reminder"],
    color: "from-amber-500 to-yellow-600",
    category: "dairy"
  },
  {
    id: "dairy_housing",
    label: "Dairy Housing Advice",
    emoji: "🏠",
    description: "Get recommendations on space, ventilation, bedding, and cow comfort",
    agents: ["DairySetupAgent", "DairyHousingAgent"],
    modules: ["confidence", "dairy_housing", "reminder"],
    color: "from-red-500 to-rose-600",
    category: "dairy"
  },
  {
    id: "dairy_milk",
    label: "Dairy Milk Production Analysis",
    emoji: "🥛",
    description: "Analyze milk yield, fat and protein percentages, and lactation curve",
    agents: ["DairySetupAgent", "DairyMilkAgent"],
    modules: ["confidence", "dairy_milk", "reminder"],
    color: "from-blue-500 to-sky-600",
    category: "dairy"
  },
  {
    id: "dairy_parasite",
    label: "Dairy Parasite Control",
    emoji: "🐛",
    description: "Identify and control ticks, lice, worms, and other parasites",
    agents: ["DairySetupAgent", "DairyParasiteAgent"],
    modules: ["confidence", "dairy_parasite", "reminder"],
    color: "from-orange-500 to-red-600",
    category: "dairy"
  },
  {
    id: "dairy_deficiency",
    label: "Dairy Nutritional Deficiency",
    emoji: "🔬",
    description: "Diagnose mineral and vitamin deficiencies from symptoms",
    agents: ["DairySetupAgent", "DairyDeficiencyAgent"],
    modules: ["confidence", "deficiency_analysis", "reminder"],
    color: "from-cyan-500 to-blue-600",
    category: "dairy"
  },
  {
    id: "dairy_business",
    label: "Dairy Business Advice",
    emoji: "📈",
    description: "Bulk buying, group marketing, value addition, and cost reduction strategies",
    agents: ["DairySetupAgent", "DairyBusinessAgent"],
    modules: ["confidence", "dairy_business", "reminder"],
    color: "from-violet-500 to-purple-600",
    category: "dairy"
  },
  {
    id: "dairy_dosdonts",
    label: "Dairy Dos and Don'ts",
    emoji: "✅❌",
    description: "Best practices for calf rearing, feeding, housing, milking, health, and breeding",
    agents: ["DairySetupAgent", "DairyDosDontsAgent"],
    modules: ["confidence", "dairy_dos_donts", "reminder"],
    color: "from-indigo-500 to-blue-600",
    category: "dairy"
  },
  {
    id: "dairy_reminders",
    label: "Dairy Reminders & Calendar",
    emoji: "📅",
    description: "Set reminders for deworming, hoof trimming, vaccination, and AI scheduling",
    agents: ["DairySetupAgent", "DairyReminderAgent"],
    modules: ["confidence", "dairy_reminders", "reminder"],
    color: "from-pink-500 to-rose-600",
    category: "dairy"
  },
  {
    id: "dairy_complete",
    label: "Complete Dairy Herd Check",
    emoji: "📋",
    description: "Full health, nutrition, breeding, housing, financial, and management assessment",
    agents: ["DairySetupAgent", "DairyHealthAgent", "DairyBreedingAgent", "DairyCalfAgent", "DairyConcentrateAgent", "DairyFeedAgent", "DairyFeedPerDayAgent", "DairyFinancialAgent", "DairyHousingAgent", "DairyMilkAgent", "DairyParasiteAgent", "DairyDeficiencyAgent", "DairyBusinessAgent", "DairyDosDontsAgent", "DairyReminderAgent"],
    modules: ["complete"],
    color: "from-indigo-600 to-blue-700",
    category: "dairy"
  },
  // ---- ADDED: Dairy Business Plan Generator ----
  {
    id: "dairy_business_plan",
    label: "Dairy Business Plan Generator",
    emoji: "📋",
    description: "Create a full business plan with vision, mission, goals, marketing, team, products, and production inputs for your dairy enterprise",
    agents: ["DairySetupAgent", "DairyBusinessPlanAgent"],
    modules: ["business"],
    color: "from-blue-500 to-cyan-600",
    category: "dairy"
  },
];

export default function RecommendationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, ready, isOnline } = useOfflineTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "crops" | "poultry" | "dairy">("all");

  const safeT = (key: string, params?: any): string => {
    try {
      const result = t(key, params);
      return typeof result === "string" ? result : key;
    } catch {
      return key;
    }
  };

  if (authLoading || !ready) {
    return <LoadingSpinner fullScreen={false} message="Loading..." />;
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  const handleSelect = (option: RecommendationOption) => {
    setLoading(true);
    localStorage.setItem("selectedRecommendation", option.id);
    localStorage.setItem("recommendationAgents", JSON.stringify(option.agents));
    localStorage.setItem("recommendationModules", JSON.stringify(option.modules));
    router.push("/interview-flow");
  };

  const filteredOptions = activeCategory === "all"
    ? OPTIONS
    : OPTIONS.filter(opt => opt.category === activeCategory);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {!isOnline && <OfflineBanner />}

      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-green-800">
            🌾 {safeT("what_do_you_need") || "What do you need today?"}
          </h1>
          <p className="text-sm text-gray-500">
            {safeT("select_recommendation") ||
              "Select what you need help with. We'll ask only the relevant questions."}
          </p>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl self-start flex-wrap">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeCategory === "all" ? "bg-white text-green-700 shadow" : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          {safeT("all") || "All"}
        </button>
        <button
          onClick={() => setActiveCategory("crops")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeCategory === "crops" ? "bg-white text-green-700 shadow" : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          🌾 {safeT("crops") || "Crops"}
        </button>
        <button
          onClick={() => setActiveCategory("poultry")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeCategory === "poultry" ? "bg-white text-orange-700 shadow" : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          🐔 {safeT("poultry") || "Poultry"}
        </button>
        <button
          onClick={() => setActiveCategory("dairy")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeCategory === "dairy" ? "bg-white text-blue-700 shadow" : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          🐄 {safeT("dairy") || "Dairy"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            disabled={loading}
            className={`bg-white p-6 rounded-2xl border-2 transition-all text-left hover:shadow-lg relative overflow-hidden ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:border-green-400"
            }`}
          >
            <div className="text-4xl mb-2">{option.emoji}</div>
            <h3 className="text-lg font-semibold text-gray-800">{option.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{option.description}</p>
            {option.id === "complete" && (
              <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {safeT("full_report") || "Full Report"}
              </span>
            )}
            {option.category === "poultry" && (
              <span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full ml-2">
                🐔 Poultry
              </span>
            )}
            {option.category === "dairy" && (
              <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                🐄 Dairy
              </span>
            )}
            {option.category === "crops" && option.id !== "complete" && (
              <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                🌾 Crops
              </span>
            )}
            <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${option.color} opacity-30`} />
          </button>
        ))}
      </div>

      {filteredOptions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {safeT("no_options_available") || "No options available for this category."}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <LoadingSpinner fullScreen={false} message="Preparing your interview..." />
        </div>
      )}
    </div>
  );
}
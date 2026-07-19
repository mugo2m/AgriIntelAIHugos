"use client";

import React from "react";

export type RecommendationType =
  | "fertilizer"
  | "disease"
  | "pest"
  | "nutrient"
  | "storage"
  | "gross_margin"
  | "conservation"
  | "gap";

interface Props {
  onSelect: (type: RecommendationType) => void;
}

const recommendations = [
  {
    id: "fertilizer",
    title: "🌱 Fertilizer Recommendation",
    description: "Planting, top dressing and fertilizer investment"
  },
  {
    id: "disease",
    title: "🦠 Disease Management",
    description: "Identify diseases and receive control recommendations"
  },
  {
    id: "pest",
    title: "🐛 Pest Management",
    description: "Integrated Pest Management (IPM)"
  },
  {
    id: "nutrient",
    title: "🟡 Nutrient Deficiency",
    description: "Diagnose nutrient deficiencies from symptoms"
  },
  {
    id: "storage",
    title: "📦 Post-Harvest & Storage",
    description: "Storage and handling recommendations"
  },
  {
    id: "gross_margin",
    title: "💰 Gross Margin Analysis",
    description: "Profitability and business analysis"
  },
  {
    id: "conservation",
    title: "🌿 Soil & Water Conservation",
    description: "Conservation and climate-smart farming"
  },
  {
    id: "gap",
    title: "✅ Good Agricultural Practices",
    description: "Best farming practices for your enterprise"
  }
] as const;

export default function RecommendationSelector({
  onSelect,
}: Props) {
  return (
    <div className="space-y-4">

      <h2 className="text-xl font-bold">
        Select the recommendation you want
      </h2>

      <p className="text-gray-500">
        Choose only one recommendation.
        You don't have to go through the entire interview.
      </p>

      <div className="grid gap-4">

        {recommendations.map((item) => (

          <button
            key={item.id}
            onClick={() => onSelect(item.id as RecommendationType)}
            className="rounded-xl border p-5 text-left hover:bg-green-50 hover:border-green-500 transition"
          >

            <div className="font-semibold">
              {item.title}
            </div>

            <div className="text-sm text-gray-500 mt-1">
              {item.description}
            </div>

          </button>

        ))}

      </div>

    </div>
  );
}
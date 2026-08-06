// app/(root)/interview-flow/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function InterviewFlowPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // ── Read from localStorage ──
    const selectedOption = localStorage.getItem("selectedRecommendation") || "complete";
    const agentNames = JSON.parse(localStorage.getItem("recommendationAgents") || "[]");
    const modules = JSON.parse(localStorage.getItem("recommendationModules") || "[]");

    // ── Build the final lists ──
    const finalAgents = [...agentNames];
    const finalModules = [...modules];

    // ── FORCE BUSINESS PLAN for ANY crop option ──
    if (selectedOption.startsWith("crop") || selectedOption === "complete") {
      const cropAgents = ["EnterpriseSetupAgent", "GAPAgent", "ProfitCalculationAgent", "BusinessPlanAgent"];
      for (const agent of cropAgents) {
        if (!finalAgents.includes(agent)) {
          finalAgents.push(agent);
        }
      }
      const cropModules = ["gap", "profit", "business"];
      for (const mod of cropModules) {
        if (!finalModules.includes(mod)) {
          finalModules.push(mod);
        }
      }
    }

    // ── FORCE BUSINESS PLAN for poultry ──
    if (selectedOption === "poultry") {
      if (!finalAgents.includes("PoultrySetupAgent")) finalAgents.push("PoultrySetupAgent");
      if (!finalAgents.includes("PoultryBusinessPlanAgent")) finalAgents.push("PoultryBusinessPlanAgent");
      if (!finalModules.includes("business")) finalModules.push("business");
    }

    // ── FORCE BUSINESS PLAN for dairy ──
    if (selectedOption === "dairy") {
      if (!finalAgents.includes("DairySetupAgent")) finalAgents.push("DairySetupAgent");
      if (!finalAgents.includes("DairyBusinessPlanAgent")) finalAgents.push("DairyBusinessPlanAgent");
      if (!finalModules.includes("business")) finalModules.push("business");
    }

    // ── Build URL ──
    const params = new URLSearchParams();
    params.set("filter", selectedOption);
    params.set("agents", finalAgents.join(","));
    params.set("modules", finalModules.join(","));

    const finalUrl = `/generate?${params.toString()}`;
    console.log("🔗 Redirecting to:", finalUrl);
    router.push(finalUrl);
  }, [user, authLoading, router]);

  return <LoadingSpinner fullScreen={false} message="Preparing your interview..." />;
}
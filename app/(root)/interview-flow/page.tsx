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

    const selectedOption = localStorage.getItem("selectedRecommendation") || "complete";
    const agentNames = JSON.parse(localStorage.getItem("recommendationAgents") || "[]");
    const modules = JSON.parse(localStorage.getItem("recommendationModules") || "[]");

    const params = new URLSearchParams();
    params.set("filter", selectedOption);
    params.set("agents", agentNames.join(","));
    params.set("modules", modules.join(","));

    router.push(`/generate?${params.toString()}`);
  }, [user, authLoading, router]);

  return <LoadingSpinner fullScreen={false} message="Preparing your interview..." />;
}
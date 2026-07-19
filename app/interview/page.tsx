// app/interview/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOfflineTranslation } from "@/lib/hooks/useOfflineTranslation";
import { InterviewOrchestrator } from "@/lib/agents/InterviewOrchestrator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function InterviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, ready, isOnline } = useOfflineTranslation();
  const router = useRouter();

  const [orchestrator] = useState(() => new InterviewOrchestrator());
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState({ current: 1, total: 9, percentage: 11 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const safeT = (key: string, params?: any): string => {
    try {
      const result = t(key, params);
      return typeof result === "string" ? result : key;
    } catch {
      return key;
    }
  };

  useEffect(() => {
    // Load selected recommendation from localStorage
    const selected = localStorage.getItem("selectedRecommendation") || "complete";
    const agents = JSON.parse(localStorage.getItem("recommendationAgents") || "[]");

    // TODO: Filter agents based on selection
    // For now, show all agents

    const questions = orchestrator.getVisibleQuestions();
    setCurrentQuestions(questions);
    setProgress(orchestrator.getProgress());
    setLoading(false);
  }, [orchestrator]);

  const handleAnswer = (questionId: string, value: any) => {
    orchestrator.saveAnswer(questionId, value);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    orchestrator.nextAgent();
    setCurrentQuestions(orchestrator.getVisibleQuestions());
    setProgress(orchestrator.getProgress());
  };

  const handlePrevious = () => {
    orchestrator.previousAgent();
    setCurrentQuestions(orchestrator.getVisibleQuestions());
    setProgress(orchestrator.getProgress());
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const allAnswers = orchestrator.getAnswers();
      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...allAnswers,
          userid: user?.uid,
          language: localStorage.getItem("preferred-language") || "en",
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/interview/${data.sessionId}`);
      } else {
        console.error("Failed to generate session:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading || !ready) {
    return <LoadingSpinner fullScreen={false} message="Loading interview..." />;
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-3xl mx-auto">
      {!isOnline && <OfflineBanner />}

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            {safeT("step")} {progress.current} {safeT("of")} {progress.total}
          </span>
          <span className="text-sm font-medium text-green-600">
            {Math.round(progress.percentage)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {safeT("current_section")}: {progress.currentAgentName}
        </p>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        {currentQuestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{safeT("no_more_questions")}</p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
            >
              {submitting ? safeT("generating") : safeT("generate_report")}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {currentQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <label className="block font-medium text-gray-800">
                  {safeT(q.key || q.id)}
                </label>
                {q.type === "select" && (
                  <select
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:border-green-500"
                  >
                    <option value="">{safeT("select")}</option>
                    {q.options?.map((opt: string) => (
                      <option key={opt} value={opt}>
                        {safeT(opt) || opt}
                      </option>
                    ))}
                  </select>
                )}
                {q.type === "number" && (
                  <input
                    type="number"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswer(q.id, parseFloat(e.target.value))}
                    placeholder={q.placeholder || ""}
                    className="w-full px-4 py-2 border rounded-xl focus:border-green-500"
                  />
                )}
                {q.type === "text" && (
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    placeholder={q.placeholder || ""}
                    className="w-full px-4 py-2 border rounded-xl focus:border-green-500"
                  />
                )}
              </div>
            ))}

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handlePrevious}
                disabled={orchestrator.isFirstAgent()}
                className="px-6 py-2 bg-gray-200 rounded-xl font-medium disabled:opacity-50"
              >
                {safeT("previous")}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
              >
                {orchestrator.isLastAgent() ? safeT("review") : safeT("next")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
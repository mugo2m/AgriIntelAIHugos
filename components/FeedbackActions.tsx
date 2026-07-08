// components/FeedbackActions.tsx
"use client";

import { useRouter } from "next/navigation";

interface FeedbackActionsProps {
  interviewId: string;
}

export default function FeedbackActions({ interviewId }: FeedbackActionsProps) {
  const router = useRouter();

  const handleRetake = () => {
    router.push(`/interview/${interviewId}/start`);
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="flex gap-4 mt-6">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleBack}
      >
        Back to Dashboard
      </button>
      <button
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={handleRetake}
      >
        Retake Interview
      </button>
    </div>
  );
}

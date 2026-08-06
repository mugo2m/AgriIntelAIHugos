// app/(root)/generate/page.tsx
import { Suspense } from "react";
import CreateInterviewAgent from "@/components/CreateInterviewAgent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { LoadingSpinner } from "@/components/LoadingSpinner";

function GenerateLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner fullScreen={false} message="Loading interview..." />
    </div>
  );
}

async function GenerateContent({ searchParams }: { searchParams: Promise<{ filter?: string; agents?: string; modules?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Please sign in to start an interview.</p>
      </div>
    );
  }

  let filter = params.filter || "complete";
  let agentNames = params.agents ? params.agents.split(",").filter(Boolean) : [];
  let modules = params.modules ? params.modules.split(",").filter(Boolean) : [];

  // ── AUTO‑INCLUDE BUSINESS PLAN AND GAP/PROFIT when filter is "complete" ──
  if (filter === "complete" && agentNames.length === 0) {
    // Include enterprise setup + all new crop modules
    agentNames = [
      "EnterpriseSetupAgent",
      "GAPAgent",
      "ProfitCalculationAgent",
      "BusinessPlanAgent",
    ];
  }

  if (filter === "complete" && modules.length === 0) {
    // Enable all crop modules
    modules = ["gap", "profit", "business"];
  }

  return (
    <CreateInterviewAgent
      userName={user.name || "Farmer"}
      userId={user.id}
      profileImage={user.profileURL}
      filter={filter}
      agents={agentNames}
      modules={modules}
    />
  );
}

export default function GeneratePage({ searchParams }: { searchParams: Promise<{ filter?: string; agents?: string; modules?: string }> }) {
  return (
    <Suspense fallback={<GenerateLoading />}>
      <GenerateContent searchParams={searchParams} />
    </Suspense>
  );
}
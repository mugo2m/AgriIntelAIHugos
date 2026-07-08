import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFarmerSessionById,
  getFeedbackByInterviewId,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  console.log("🌾🌾🌾 FARMER SESSION PAGE LOADED 🌾🌾🌾");
  console.log("Session ID:", id);

  const user = await getCurrentUser();
  console.log("Current user:", user?.id);

  // Get language from cookie
  const cookieStore = await cookies();
  const language = cookieStore.get('preferred-language')?.value || 'en';
  console.log("🌐 Language from cookie:", language);

  // Get farmer session with language preference
  const session = await getFarmerSessionById(id, language);
  console.log("Farmer session data:", {
    exists: !!session,
    crops: session?.crops,
    county: session?.county,
    acres: session?.acres,
    recommendations: session?.recommendations?.length,
    language: session?.language
  });

  if (!session) {
    console.log("❌ Farmer session not found, redirecting...");
    redirect("/");
  }

  let feedback = null;
  try {
    if (user?.id) {
      const feedbackResult = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user.id,
      });
      if (feedbackResult && typeof feedbackResult === 'object') {
        feedback = feedbackResult;
      }
    }
  } catch (error) {
    console.log("⚠️ Feedback fetch skipped or failed (normal for new sessions)");
    feedback = null;
  }

  console.log("Feedback exists:", !!feedback);

  return (
    <>
      <div className="flex flex-row gap-4 justify-between bg-green-50 p-4 rounded-xl mb-4">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-xl">
              🌾
            </div>
            <div>
              <h3 className="capitalize text-xl font-semibold text-green-800">
                {session.crops?.join(", ")} Farm
              </h3>
              <p className="text-sm text-gray-600">
                {session.county}{session.subCounty ? `, ${session.subCounty}` : ""}
                {session.village ? `, ${session.village}` : ""}
              </p>
            </div>
          </div>

          <div className="flex gap-3 ml-4">
            {session.acres && (
              <span className="bg-white px-3 py-1 rounded-full text-sm">
                📏 {session.acres} acres
              </span>
            )}
            {session.cattle > 0 && (
              <span className="bg-white px-3 py-1 rounded-full text-sm">
                🐄 {session.cattle} cattle
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium">
            🌱 Ask & Learn
          </span>
        </div>
      </div>

      <Agent
        userName={user?.name || "Farmer"}
        userId={user?.id}
        interviewId={id}
        sessionData={session}
        profileImage={user?.profileURL}
      />
    </>
  );
};

export default InterviewDetails;
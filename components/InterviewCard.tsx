import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn, getRandomInterviewCover } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

// Updated interface to handle both interview and farmer session data
interface FarmerSessionCardProps {
  id?: string;
  userId?: string;
  role?: string;          // For backward compatibility
  type?: string;          // For backward compatibility
  techstack?: string[];   // For backward compatibility
  createdAt?: string;
  // New farmer session fields
  crops?: string[];
  county?: string;
  acres?: number;
  cattle?: number;
  queryCount?: number;
  lastQueryAt?: string;
}

const InterviewCard = async ({
  id,
  userId,
  role,
  type,
  techstack,
  createdAt,
  // New farmer fields
  crops,
  county,
  acres,
  cattle,
  queryCount,
  lastQueryAt,
}: FarmerSessionCardProps) => {

  console.log("Card DEBUG - id:", id, "userId:", userId);

  // Try to get feedback if it exists (for backward compatibility)
  const feedback =
    userId && id
      ? await getFeedbackByInterviewId({
          interviewId: id,
          userId,
        }).catch(() => null)
      : null;

  // Determine if this is a farmer session (has crops) or interview (has role)
  const isFarmerSession = crops && crops.length > 0;

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || lastQueryAt || Date.now()
  ).format("MMM D, YYYY");

  // Farmer Session Card
  if (isFarmerSession) {
    return (
      <div className="card-border w-[360px] max-sm:w-full min-h-96 hover:shadow-lg transition-all">
        <div className="card-interview bg-gradient-to-br from-green-50 to-white">
          <div>
            {/* Farm Badge */}
            <div className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-green-600">
              <p className="badge-text text-white">🌾 Farm Session</p>
            </div>

            {/* Farm Icon */}
            <div className="w-[90px] h-[90px] rounded-full bg-green-100 flex items-center justify-center text-4xl">
              🌱
            </div>

            {/* Farm Details */}
            <h3 className="mt-5 capitalize text-green-800 font-semibold">
              {crops?.join(", ")} Farm
            </h3>

            {/* Location & Stats */}
            <div className="flex flex-row gap-5 mt-3">
              <div className="flex flex-row gap-2">
                <Image src="/location.svg" width={22} height={22} alt="location" />
                <p className="text-sm">{county || "Unknown location"}</p>
              </div>

              {acres && (
                <div className="flex flex-row gap-2 items-center">
                  <Image src="/ruler.svg" width={22} height={22} alt="acres" />
                  <p className="text-sm">{acres} acres</p>
                </div>
              )}
            </div>

            {/* Additional Stats */}
            <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-600">
              {cattle > 0 && (
                <span className="bg-blue-50 px-2 py-1 rounded">🐄 {cattle} cattle</span>
              )}
              {queryCount > 0 && (
                <span className="bg-purple-50 px-2 py-1 rounded">
                  💬 {queryCount} questions asked
                </span>
              )}
            </div>

            {/* Session Date */}
            <p className="text-xs text-gray-400 mt-3">
              Last activity: {formattedDate}
            </p>
          </div>

          <div className="flex flex-row justify-between mt-4">
            <div className="flex-1" /> {/* Spacer */}

            <Button className="btn-primary bg-green-600 hover:bg-green-700">
              <Link href={`/interview/${id}`}>
                Ask Questions →
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Original Interview Card (for backward compatibility)
  const normalizedType = /mix/gi.test(type || "") ? "Mixed" : type || "Technical";

  const badgeColor =
    {
      Behavioral: "bg-light-400",
      Mixed: "bg-light-600",
      Technical: "bg-light-800",
    }[normalizedType] || "bg-light-600";

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          {/* Type Badge */}
          <div
            className={cn(
              "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
              badgeColor
            )}
          >
            <p className="badge-text ">{normalizedType}</p>
          </div>

          {/* Cover Image */}
          <Image
            src={getRandomInterviewCover()}
            alt="cover-image"
            width={90}
            height={90}
            className="rounded-full object-fit size-[90px]"
          />

          {/* Interview Role */}
          <h3 className="mt-5 capitalize">{role || "Interview"}</h3>

          {/* Date & Score */}
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image
                src="/calendar.svg"
                width={22}
                height={22}
                alt="calendar"
              />
              <p>{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" width={22} height={22} alt="star" />
              <p>{feedback?.totalScore || "---"}/100</p>
            </div>
          </div>

          {/* Feedback or Placeholder Text */}
          <p className="line-clamp-2 mt-5">
            {feedback?.finalAssessment ||
              "You haven't taken this interview yet. Take it now to improve your skills."}
          </p>
        </div>

        <div className="flex flex-row justify-between">
          <DisplayTechIcons techStack={techstack || []} />

          <Button className="btn-primary">
            <Link
              href={
                feedback
                  ? `/interview/${id}/feedback`
                  : `/interview/${id}`
              }
            >
              {feedback ? "Check Feedback" : "View Interview"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
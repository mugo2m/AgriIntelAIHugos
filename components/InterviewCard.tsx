// components/InterviewCard.tsx – UPDATED with poultry + dairy support
import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn, getRandomInterviewCover } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

// Updated interface to handle all session types
interface FarmerSessionCardProps {
  id?: string;
  userId?: string;
  role?: string;          // For backward compatibility
  type?: string;          // For backward compatibility
  techstack?: string[];   // For backward compatibility
  createdAt?: string;
  // Crop fields
  crops?: string[];
  county?: string;
  acres?: number;
  cattle?: number;
  // Poultry fields
  isPoultry?: boolean;
  poultry?: {
    breed?: string;
    system?: string;
    flockSize?: number;
    ageWeeks?: number;
  };
  // Dairy fields
  isDairy?: boolean;
  dairy?: {
    breed?: string;
    cowCategory?: string;
    milkYieldPerDay?: number;
    bodyWeightKg?: number;
  };
  // Common fields
  queryCount?: number;
  lastQueryAt?: string;
  species?: string;
}

const InterviewCard = async ({
  id,
  userId,
  role,
  type,
  techstack,
  createdAt,
  // Crop fields
  crops,
  county,
  acres,
  cattle,
  // Poultry fields
  isPoultry,
  poultry,
  // Dairy fields
  isDairy,
  dairy,
  // Common
  queryCount,
  lastQueryAt,
  species,
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

  // ===== DETECT SESSION TYPE =====
  const isCropSession = crops && crops.length > 0;
  const isPoultrySession = isPoultry === true || species === 'poultry';
  const isDairySession = isDairy === true || species === 'dairy';
  const isFarmerSession = isCropSession || isPoultrySession || isDairySession;

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || lastQueryAt || Date.now()
  ).format("MMM D, YYYY");

  // ===== FARMER SESSION CARD (Crop, Poultry, or Dairy) =====
  if (isFarmerSession) {
    // ===== DETERMINE DISPLAY DATA =====
    let emoji = "🌾";
    let badgeText = "Farm Session";
    let title = "";
    let subtitle = "";
    let icon = "🌱";
    let detailItems: { label: string; value: string | number }[] = [];

    if (isCropSession) {
      emoji = "🌾";
      badgeText = "Farm Session";
      title = crops?.join(", ") || "Farm";
      subtitle = county || "Unknown location";
      icon = "🌱";
      detailItems = [
        { label: "Acres", value: acres || "?" },
        { label: "Cattle", value: cattle || 0 },
      ];
    } else if (isPoultrySession) {
      emoji = "🐔";
      badgeText = "Poultry Session";
      title = poultry?.breed || "Poultry";
      subtitle = `${poultry?.system || ""}${county ? ` • ${county}` : ""}`;
      icon = "🐔";
      detailItems = [
        { label: "Flock size", value: poultry?.flockSize || 0 },
        { label: "Age", value: `${poultry?.ageWeeks || 0} weeks` },
      ];
    } else if (isDairySession) {
      emoji = "🐄";
      badgeText = "Dairy Session";
      title = dairy?.breed || "Dairy";
      const category = dairy?.cowCategory || "";
      subtitle = `${category}${county ? ` • ${county}` : ""}`;
      icon = "🐄";
      detailItems = [
        { label: "Milk yield", value: `${dairy?.milkYieldPerDay || 0} L/day` },
        { label: "Body weight", value: `${dairy?.bodyWeightKg || 0} kg` },
      ];
    }

    return (
      <div className="card-border w-[360px] max-sm:w-full min-h-96 hover:shadow-lg transition-all">
        <div className="card-interview bg-gradient-to-br from-green-50 to-white">
          <div>
            {/* Badge */}
            <div className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-green-600">
              <p className="badge-text text-white">{emoji} {badgeText}</p>
            </div>

            {/* Icon */}
            <div className="w-[90px] h-[90px] rounded-full bg-green-100 flex items-center justify-center text-4xl">
              {icon}
            </div>

            {/* Title */}
            <h3 className="mt-5 capitalize text-green-800 font-semibold">
              {title}
            </h3>

            {/* Subtitle / Location */}
            <div className="flex flex-row gap-5 mt-3">
              <div className="flex flex-row gap-2">
                <Image src="/location.svg" width={22} height={22} alt="location" />
                <p className="text-sm">{subtitle || "Unknown location"}</p>
              </div>
            </div>

            {/* Detail Items */}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600">
              {detailItems.map((item, idx) => (
                <span key={idx} className="bg-white px-3 py-1 rounded-full shadow-sm">
                  {item.label}: {item.value}
                </span>
              ))}
              {queryCount && queryCount > 0 && (
                <span className="bg-purple-50 px-3 py-1 rounded-full shadow-sm">
                  💬 {queryCount} questions
                </span>
              )}
            </div>

            {/* Session Date */}
            <p className="text-xs text-gray-400 mt-3">
              Last activity: {formattedDate}
            </p>
          </div>

          <div className="flex flex-row justify-between mt-4">
            <div className="flex-1" />
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

  // ===== ORIGINAL INTERVIEW CARD (Backward Compatibility) =====
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
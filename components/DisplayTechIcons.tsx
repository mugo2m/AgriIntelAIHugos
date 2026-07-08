// components/DisplayTechIcons.tsx
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TechIcon {
  tech: string;
  url: string;
}

interface DisplayTechIconsProps {
  techIcons?: TechIcon[]; // optional, in case parent passes undefined
}

export default function DisplayTechIcons({ techIcons = [] }: DisplayTechIconsProps) {
  // Ensure techIcons is always an array
  const safeTechIcons = Array.isArray(techIcons) ? techIcons : [];

  return (
    <div className="flex flex-row gap-2">
      {safeTechIcons.slice(0, 3).map(({ tech, url }, index) => (
        <div key={tech || index} className={cn("w-8 h-8 relative")}>
          <Image
            src={url}
            alt={tech || "tech icon"}
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
      ))}
    </div>
  );
}

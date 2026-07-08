// app/generate/page.tsx - GENERATE PAGE
import CreateInterviewAgent from "@/components/CreateInterviewAgent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

// 🔥 ADD THIS LINE - Forces dynamic rendering, skips build-time static generation
export const dynamic = 'force-dynamic';

const Page = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h3 className="text-2xl font-bold mb-6">Interview Generation</h3>

      <CreateInterviewAgent
        userName={user?.name || "User"}
        userId={user?.id}
        profileImage={user?.profileURL}
      />
    </div>
  );
};

export default Page;
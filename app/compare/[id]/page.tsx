// app/compare/[id]/page.tsx
import { db } from "@/firebase/admin";
import CropComparisonClient from "@/components/CropComparisonClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CropComparisonPage({ params }: PageProps) {
  const { id } = await params;

  // Get session data from Firebase
  let sessionData = null;
  try {
    const session = await db.collection("farmer_sessions").doc(id).get();
    if (session.exists) {
      sessionData = { id: session.id, ...session.data() };
    }
  } catch (error) {
    console.error("Error fetching session:", error);
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold">Session Not Found</h1>
          <p className="mt-2">The comparison data you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <CropComparisonClient sessionData={sessionData} sessionId={id} />;
}
// app/financial/[id]/page.tsx
import { db } from "@/firebase/admin";
import FinancialAnalysisClient from "@/components/FinancialAnalysisClient";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FinancialAnalysisPage({ params }: PageProps) {
  const { id } = await params;

  // Get session data from Firebase
  let sessionData = null;
  try {
    const session = await db.collection("farmer_sessions").doc(id).get();
    if (session.exists) {
      sessionData = { id: session.id, ...session.data() };

      // Log for debugging
      console.log("📊 FinancialAnalysisPage - Raw session data:", {
        id: sessionData.id,
        hasGrossMargin: !!sessionData.grossMarginAnalysis,
        grossMarginType: sessionData.grossMarginAnalysis ?
          (sessionData.grossMarginAnalysis.crop ? "has crop field" : "no crop field") : "none",
        crops: sessionData.crops
      });
    }
  } catch (error) {
    console.error("Error fetching session:", error);
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="text-center text-white p-8">
          <h1 className="text-3xl font-bold mb-4">Session Not Found</h1>
          <p className="text-xl opacity-90">The financial analysis you're looking for doesn't exist.</p>
          <a href="/" className="mt-6 inline-block px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return <FinancialAnalysisClient sessionData={sessionData} sessionId={id} />;
}
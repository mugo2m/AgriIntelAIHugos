// app/(root)/page.tsx
import { Suspense } from 'react';
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getFarmerSessionsByUserId } from "@/lib/actions/general.action";
import { db } from "@/firebase/admin";
import HomeContent from "./HomeContent";

// Loading component
function HomeLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
    </div>
  );
}

// Async data fetching component
async function HomeContentWrapper() {
  const user = await getCurrentUser();

  console.log('🔍 [HOME PAGE] Current user:', user);
  console.log('🔍 [HOME PAGE] User ID:', user?.id);
  console.log('🔍 [HOME PAGE] User email:', user?.email);
  console.log('🔍 [HOME PAGE] Full user object:', JSON.stringify(user, null, 2));

  let farmerSessions = [];
  let recentQueries = [];

  if (user) {
    console.log(`🔍 [HOME PAGE] Fetching sessions for user: ${user.id}`);
    farmerSessions = await getFarmerSessionsByUserId(user.id);
    console.log(`🔍 [HOME PAGE] Sessions found: ${farmerSessions.length}`);
    console.log('🔍 [HOME PAGE] Sessions details:', farmerSessions.map(s => ({
      id: s.id,
      crops: s.crops,
      farmerName: s.farmerName,
      createdAt: s.createdAt,
      userId: s.userId
    })));

    if (farmerSessions.length > 0) {
      const lastSession = farmerSessions[0];
      try {
        const queriesSnapshot = await db
          .collection("farmer_sessions")
          .doc(lastSession.id)
          .collection("queries")
          .orderBy("timestamp", "desc")
          .limit(3)
          .get();

        recentQueries = queriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`🔍 [HOME PAGE] Recent queries: ${recentQueries.length}`);
      } catch (error) {
        console.error("Error fetching recent queries:", error);
      }
    }
  } else {
    console.log('🔍 [HOME PAGE] No user logged in');
  }

  return <HomeContent user={user} farmerSessions={farmerSessions} recentQueries={recentQueries} />;
}

// Main page with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContentWrapper />
    </Suspense>
  );
}
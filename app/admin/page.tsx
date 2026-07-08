// app/admin/page.tsx
// ✅ ADD THESE LINES AT THE VERY TOP
export const runtime = 'nodejs';
export const dynamic = 'force-static';

import { FirebaseCacheDashboard } from '@/components/FirebaseCacheDashboard';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Cache Management Dashboard</h1>
      <FirebaseCacheDashboard />
    </div>
  );
}
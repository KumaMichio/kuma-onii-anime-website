import { Suspense } from 'react';

import HomeClient from '@/components/HomeClient';

export default function HomePage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>}
    >
      <HomeClient />
    </Suspense>
  );
}

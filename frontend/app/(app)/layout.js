'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import { Spinner } from '@/components/ui';

// Ichki sahifalar: faqat tizimga kirganlar uchun
export default function AppLayout({ children }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="center-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="shell">
      <main className="main">{children}</main>
      <BottomNav />
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/ui';

export default function Providers({ children }) {
  // PWA: telefonga "ilova" sifatida o'rnatish uchun service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}

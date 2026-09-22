'use client';

import { Suspense } from 'react';
import MovementForm from '@/components/MovementForm';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MovementForm type="out" />
    </Suspense>
  );
}

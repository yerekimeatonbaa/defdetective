'use client';

import React from 'react';

// This file is no longer needed for Firebase initialization as it is handled
// by the FirebaseClientProvider and the modern Firebase hook structure.
// All provider logic has been centralized in src/components/providers.tsx.

export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

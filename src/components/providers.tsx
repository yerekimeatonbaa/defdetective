
"use client";

import type { FC, ReactNode } from "react";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { SoundProvider } from "@/hooks/use-sound";
import { ThemeProvider } from "@/hooks/use-theme";
import { FirebaseClientProvider } from "@/firebase/client-provider";

interface ProvidersProps {
  children: ReactNode;
}

const Providers: FC<ProvidersProps> = ({ children }) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // register service worker (best-effort)
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => console.warn('Service worker registration failed:', err));
      });
    }
  }, []);
  return (
    <FirebaseClientProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <SoundProvider>
            {children}
            <Toaster />
          </SoundProvider>
        </AuthProvider>
      </ThemeProvider>
    </FirebaseClientProvider>
  );
};

export default Providers;

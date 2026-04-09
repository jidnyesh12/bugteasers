"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AppQueryProvider } from "@/lib/state/query/query-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppQueryProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </AppQueryProvider>
  );
}

"use client";

import { AuthzProvider } from "@/components/authz/AuthzProvider";
import { useMyPermissions } from "@/hooks/useMyPermissions";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { permissions, loading } = useMyPermissions();

  return (
    <AuthzProvider permissions={permissions} loading={loading}>
      {children}
    </AuthzProvider>
  );
}
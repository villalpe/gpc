"use client";

import React, { createContext, useContext, useMemo } from "react";
import { hasPermission, Permission } from "@/lib/permissions";

type AuthzContextType = {
  permissions: string[];
  loading: boolean;
  can: (required: Permission | Permission[]) => boolean;
};

const AuthzContext = createContext<AuthzContextType>({
  permissions: [],
  loading: true,
  can: () => false,
});

export function AuthzProvider({
  permissions,
  loading,
  children,
}: {
  permissions: string[];
  loading: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      permissions,
      loading,
      can: (required: Permission | Permission[]) =>
        hasPermission(permissions, required),
    }),
    [permissions, loading]
  );

  return <AuthzContext.Provider value={value}>{children}</AuthzContext.Provider>;
}

export function useAuthz() {
  return useContext(AuthzContext);
}
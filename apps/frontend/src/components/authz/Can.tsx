"use client";

import React from "react";
import { useAuthz } from "./AuthzProvider";
import { Permission } from "@/lib/permissions";

export function Can({
  do: required,
  fallback = null,
  loadingFallback = null,
  children,
}: {
  do: Permission | Permission[];
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { loading, can } = useAuthz();

  if (loading) return <>{loadingFallback}</>;
  if (!can(required)) return <>{fallback}</>;
  return <>{children}</>;
}
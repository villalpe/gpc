"use client";

import React from "react";
import { useAuthz } from "./AuthzProvider";
import { Permission } from "@/lib/permissions";

export function RequirePermission({
  required,
  children,
}: {
  required: Permission | Permission[];
  children: React.ReactNode;
}) {
  const { loading, can } = useAuthz();

  if (loading) return <div>Cargando...</div>;
  if (!can(required)) return <div>No tienes permisos para ver esta sección.</div>;

  return <>{children}</>;
}
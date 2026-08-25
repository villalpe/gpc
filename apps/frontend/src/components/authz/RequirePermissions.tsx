"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthz } from "./AuthzProvider";
import { useMyPermissions } from "@/hooks/useMyPermissions";
import { Permission } from "@/lib/permissions";

export function RequirePermission({
  required,
  children,
}: {
  required: Permission | Permission[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, can } = useAuthz();
  const { redirectTo } = useMyPermissions();

  useEffect(() => {
    if (redirectTo) router.push(redirectTo);
  }, [redirectTo, router]);

  if (loading) return <div>Cargando...</div>;

  // Si viene 401 desde permisos, mostramos mensaje corto mientras redirige
  if (redirectTo) {
    return <div>Tu sesión expiró. Redirigiendo a login...</div>;
  }

  // 403 / falta de permiso
  if (!can(required)) return <div>No autorizado para esta acción.</div>;

  return <>{children}</>;
}
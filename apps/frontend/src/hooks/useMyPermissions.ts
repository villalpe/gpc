"use client";

import { useEffect, useState } from "react";

type PermissionsResponse = {
  permissions: string[];
};

export function useMyPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        const res = await fetch("/api/me/permissions", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setPermissions([]);
          return;
        }

        const data: PermissionsResponse = await res.json();
        if (mounted) setPermissions(data.permissions || []);
      } catch {
        if (mounted) setPermissions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  return { permissions, loading };
}
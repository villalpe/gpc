"use client";

import Link from "next/link";
import { Can } from "@/components/authz/Can";

export function Sidebar() {
  return (
    <nav>
      <ul>
        <Can do="inventory.read">
          <li>
            <Link href="/inventory">Inventario</Link>
          </li>
        </Can>

        <Can do="audit.read">
          <li>
            <Link href="/audit">Auditoría</Link>
          </li>
        </Can>

        <Can do="users.invite">
          <li>
            <Link href="/users">Usuarios</Link>
          </li>
        </Can>
      </ul>
    </nav>
  );
}
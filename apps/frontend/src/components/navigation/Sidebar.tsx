"use client";

import Link from "next/link";
import { Can } from "@/components/authz/Can";

export function Sidebar() {
  return (
    <nav>
      <li style={{ color: "red" }}>DEBUG SIDEBAR NUEVO NUEVO</li>
      <ul>
        <Can do="inventory.read">
          <li><Link href="/inventory">Inventario</Link></li>
            <li>DEBUG can inventory.read</li>
            <li><Link href="/inventory">Inventario</Link></li>
        </Can>

        <Can do="audit.read">
          <li><Link href="/audit">Auditoría</Link></li>
          <li>DEBUG can inventory.read</li>
          <li><Link href="/inventory">Inventario</Link></li>          
        </Can>

        <Can do={["users.invite"]}>
          <li><Link href="/users">Usuarios</Link></li>
          <li>DEBUG can inventory.read</li>
          <li><Link href="/inventory">Inventario</Link></li>          
        </Can>
      </ul>
    </nav>
  );
}
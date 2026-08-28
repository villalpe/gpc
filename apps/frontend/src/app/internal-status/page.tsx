import Link from "next/link";
import { healthCheck } from "@/lib/api";

export default async function Home() {
  const data = await healthCheck();

  return (
    <main style={{ padding: 24 }}>
      <h1>GPC Platform</h1>
      <p>Backend status: {data.status}</p>
      <p>Service: {data.service}</p>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <Link href="/login">Ir a Login</Link>
        <Link href="/dashboard">Ir a Dashboard</Link>
      </div>
    </main>
  );
}
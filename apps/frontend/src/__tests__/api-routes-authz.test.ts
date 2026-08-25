import { describe, it, expect } from "vitest";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Internal API auth/authz smoke", () => {
  it("GET /api/me without session should be unauthorized", async () => {
    const res = await fetch(`${BASE}/api/me`, { method: "GET" });
    expect([401, 403]).toContain(res.status);
  });

  it("GET /api/me/permissions without valid context should fail gracefully", async () => {
    const res = await fetch(`${BASE}/api/me/permissions`, { method: "GET" });
    expect([400, 401, 403]).toContain(res.status);
  });

  it("GET /api/modules/inventory/ping/ should respond (auth dependent)", async () => {
    const res = await fetch(`${BASE}/api/modules/inventory/ping/`, { method: "GET" });
    expect([200, 401, 403]).toContain(res.status);
  });
});
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendFedexLabelEmail } from "./fedex-label-email";

afterEach(() => vi.unstubAllGlobals());

describe("sendFedexLabelEmail", () => {
  it("requests the saved label email for the selected CB, tracking number and recipient", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sent: true }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    await sendFedexLabelEmail("S123456789", "123456789012", "test@example.com");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/fedex/shipments/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cb_number: "S123456789",
        tracking_number: "123456789012",
        recipient_email: "test@example.com",
      }),
    });
  });

  it("surfaces backend errors and rejects unconfirmed responses", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "Correo no configurado." }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ recipient_email: ["Correo inválido."] }), { status: 400 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockRejectedValueOnce(new Error("Error de conexión"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendFedexLabelEmail("S123456789", "123", "test@example.com"))
      .rejects.toThrow("Correo no configurado.");
    await expect(sendFedexLabelEmail("S123456789", "123", "bad"))
      .rejects.toThrow("Correo inválido.");
    await expect(sendFedexLabelEmail("S123456789", "123", "test@example.com"))
      .rejects.toThrow("No se pudo confirmar");
    await expect(sendFedexLabelEmail("S123456789", "123", "test@example.com"))
      .rejects.toThrow("Error de conexión");
  });
});

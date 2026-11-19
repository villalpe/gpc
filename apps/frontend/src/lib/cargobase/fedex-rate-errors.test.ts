import { describe, expect, it } from "vitest";
import { rateValidationErrors } from "./fedex-rate-errors";

describe("FedEx rate validation errors", () => {
  it("identifies invalid state codes for both parties", () => {
    expect(rateValidationErrors({
      sender: { state: ["Máximo 3 caracteres."] },
      recipient: { state: ["Máximo 3 caracteres."] },
    })).toEqual([
      "Remitente / Estado / provincia: Máximo 3 caracteres.",
      "Destinatario / Estado / provincia: Máximo 3 caracteres.",
    ]);
  });

  it("identifies package fields and preserves general errors", () => {
    expect(rateValidationErrors({
      packages: [{ weight: ["Peso inválido."] }],
      detail: "No se puede consultar.",
    })).toEqual([
      "Paquetes / Paquete 1 / Peso: Peso inválido.",
      "No se puede consultar.",
    ]);
  });
});

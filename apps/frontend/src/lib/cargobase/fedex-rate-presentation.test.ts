import { describe, expect, it } from "vitest";
import {
  formatRateAmount,
  groupRatesByDelivery,
  rateDelivery,
  selectedRateSummary,
} from "./fedex-rate-presentation";

describe("FedEx rate delivery presentation", () => {
  it("formats FedEx delivery date and time in Spanish without changing the day", () => {
    expect(rateDelivery("2026-11-25T12:00:00")).toEqual({
      dateKey: "2026-11-25",
      dateLabel: "Miércoles, 25 de noviembre de 2026",
      timeLabel: "12:00",
    });
  });

  it("supports dates without delivery times and invalid or missing estimates", () => {
    expect(rateDelivery("2026-11-24")).toMatchObject({
      dateKey: "2026-11-24",
      timeLabel: null,
    });
    expect(rateDelivery("not-a-date")).toEqual({
      dateKey: null, dateLabel: null, timeLabel: null,
    });
    expect(rateDelivery(null)).toEqual({
      dateKey: null, dateLabel: null, timeLabel: null,
    });
  });

  it("formats estimates only when FedEx provided an amount and currency", () => {
    expect(formatRateAmount(125, "USD")).toBe("125.00 USD");
    expect(formatRateAmount(null, "USD")).toBe("No proporcionado");
  });

  it("builds the selected service summary with delivery day, time, and estimated price", () => {
    expect(selectedRateSummary({
      service_name: "FedEx 2Day AM",
      delivery_date: "2026-11-25T12:00:00",
      amount: 58,
      currency: "USD",
    })).toBe(
      "Servicio seleccionado: FedEx 2Day AM — Miércoles, 25 de noviembre de 2026 hasta las 12:00 — costo estimado: 58.00 USD"
    );
  });

  it("groups services by delivery day and orders times within each day", () => {
    const groups = groupRatesByDelivery([
      { service: "late", delivery_date: "2026-11-25T17:00:00" },
      { service: "early", delivery_date: "2026-11-25T12:00:00" },
      { service: "next", delivery_date: "2026-11-26T17:00:00" },
      { service: "unknown", delivery_date: null },
    ]);
    expect(groups.map((group) => [group.label, group.rates.map((rate) => rate.service)]))
      .toEqual([
        ["Miércoles, 25 de noviembre de 2026", ["early", "late"]],
        ["Jueves, 26 de noviembre de 2026", ["next"]],
        ["Fecha de entrega por confirmar", ["unknown"]],
      ]);
  });
});

import { describe, expect, it } from "vitest";
import {
  fedexRateQuoteKey,
  fedexDraftFromCargobase,
  fedexDomesticShipmentPayload,
  isInternationalFedexDraft,
} from "./fedex";
import { fedexRoute, fedexServices } from "./fedex-services";

describe("Cargobase to FedEx draft mapping", () => {
  it("omits customs fields when serializing a domestic shipment", () => {
    const draft = fedexDraftFromCargobase({
      organization: { good_items: [
        { units: 2, weight: 5, w_unit: "lb", length: 10, width: 8, height: 4, m_unit: "in" },
        { units: 1, weight: 3, w_unit: "lb", length: 6, width: 5, height: 4, m_unit: "in" },
      ] },
      schedule: { pickup_country_code: "US", stop1_country_code: "US" },
    }, "S123456789");
    const payload = JSON.parse(JSON.stringify(fedexDomesticShipmentPayload(draft)));

    expect(draft.packages[0].customs_items).toHaveLength(1);
    expect(draft.pickup_type).toBe("DROPOFF_AT_FEDEX_LOCATION");
    expect(JSON.parse(fedexRateQuoteKey(draft)).pickup_type).toBe(draft.pickup_type);
    expect(payload).not.toHaveProperty("duties_payment_type");
    expect(payload).not.toHaveProperty("duties_account_number");
    expect(payload.pickup_type).toBe(draft.pickup_type);
    expect(payload.packages).toHaveLength(2);
    for (const [index, item] of payload.packages.entries()) {
      expect(item).not.toHaveProperty("customs_items");
      expect(item.quantity).toBe(draft.packages[index].quantity);
      expect(item.weight).toBe(draft.packages[index].weight);
    }
  });

  it("maps parties, package measurements, customs data, and requester email", () => {
    const draft = fedexDraftFromCargobase(
      {
        organization: {
          requestor_email: "requestor@example.com",
          good_items: [
            {
              units: 2,
              weight: 1.5,
              w_unit: "kg",
              length: 20,
              width: 15,
              height: 10,
              m_unit: "cm",
              good_customs_information: [
                {
                  description: "Spare parts",
                  hs_code: "123456",
                  origin_country: "MX",
                  value: 100,
                  currency_code: "USD",
                },
                {
                  description: "Accessory",
                  hs_code: "654321",
                  origin_country: "US",
                  quantity: 1,
                  weight: 0.25,
                  weight_units: "kg",
                  value: 25,
                  currency_code: "USD",
                },
              ],
            },
          ],
        },
        schedule: {
          pickup_country_code: "MX",
          pickup_street: "Sender Street",
          pickup_city: "Mexico City",
          pickup_zipcode: "01000",
          pickup_contact_name: "Sender",
          pickup_contact_phone: "5555555555",
          stop1_country_code: "US",
          stop1_street: "Receiver Street",
          stop1_city: "Austin",
          stop1_zipcode: "78701",
          stop1_contact_name: "Receiver",
          stop1_contact_phone: "5555555556",
          pickup_datetime: "2026-11-18T10:00:00Z",
        },
      },
      "S123456789",
      new Date(2026, 10, 20, 0, 10)
    );

    expect(draft.sender.country_code).toBe("MX");
    expect(draft.recipient.country_code).toBe("US");
    expect(draft.packages[0].weight).toBe("3.31");
    expect(draft.packages[0].weight_units).toBe("LB");
    expect(draft.packages[0].customs_items[1].weight).toBe("0.55");
    expect(draft.packages[0].customs_items[1].weight_units).toBe("LB");
    expect(draft.packages[0].dimension_units).toBe("IN");
    expect([draft.packages[0].length, draft.packages[0].width, draft.packages[0].height])
      .toEqual(["8", "6", "4"]);
    expect(draft.packaging_type).toBe("YOUR_PACKAGING");
    expect(draft.packages[0].customs_items).toHaveLength(2);
    expect(draft.packages[0].customs_items[1].hs_code).toBe("654321");
    expect(draft.recipient_email).toBe("requestor@example.com");
    expect(draft.ship_date).toBe("2026-11-20");
    expect(isInternationalFedexDraft(draft)).toBe(true);
  });

  it("normalizes US state prefixes without altering other states", () => {
    const draft = fedexDraftFromCargobase({
      schedule: {
        pickup_country_code: "US", pickup_state_code: "US-OH",
        stop1_country_code: "MX", stop1_state_code: "MX-AGU",
      },
    }, "S123456789");
    expect(draft.sender.state).toBe("OH");
    expect(draft.recipient.state).toBe("MX-AGU");
  });

  it("keeps a selected rate tied to its shipment inputs but not its ship date", () => {
    const draft = fedexDraftFromCargobase({
      organization: { good_items: [{
        units: 1, weight: 5, w_unit: "lb",
        length: 10, width: 8, height: 4, m_unit: "in",
      }] },
      schedule: {
        pickup_country_code: "US", pickup_zipcode: "43215",
        stop1_country_code: "US", stop1_zipcode: "78701",
      },
    }, "S123456789");
    const originalKey = fedexRateQuoteKey(draft);
    expect(fedexRateQuoteKey({ ...draft, ship_date: "2026-11-25" })).toBe(originalKey);
    expect(fedexRateQuoteKey({
      ...draft,
      packages: [{ ...draft.packages[0], weight: "6" }],
    })).not.toBe(originalKey);
  });

  it("preserves inch and unknown measurements without inventing units", () => {
    const draft = fedexDraftFromCargobase({
      organization: { good_items: [
        { length: 10, width: 5, height: 3, m_unit: "IN" },
        { length: 12, width: 8, height: 2 },
        { length: 0.1, width: "", height: 2.54, m_unit: "CM" },
      ] },
    }, "S123456789");
    expect(draft.packages[0].length).toBe("10");
    expect(draft.packages[0].dimension_units).toBe("IN");
    expect(draft.packages[1].length).toBe("12");
    expect(draft.packages[1].dimension_units).toBe("");
    expect([draft.packages[2].length, draft.packages[2].width, draft.packages[2].height])
      .toEqual(["1", "", "1"]);
  });

  it("uses only complete country codes to choose the reference list", () => {
    expect(fedexRoute(" mx ", "MX")).toBe("domestic");
    expect(fedexRoute("MX", "US")).toBe("international");
    expect(fedexRoute("", "US")).toBe("unknown");
    expect(fedexRoute("Mexico", "US")).toBe("unknown");
    expect(fedexServices("unknown")).toEqual([]);
    expect(fedexServices("domestic")).toHaveLength(14);
    expect(fedexServices("international")).toHaveLength(19);
    for (const route of ["domestic", "international"] as const) {
      expect(fedexServices(route).filter((service) => /freight/i.test(service.label)).length)
        .toBeGreaterThan(0);
      expect(fedexServices(route).every(
        (service) => !/freight/i.test(service.label) || !service.code
      )).toBe(true);
    }
  });
});

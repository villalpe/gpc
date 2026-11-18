import { describe, expect, it } from "vitest";
import {
  fedexDraftFromCargobase,
  isInternationalFedexDraft,
} from "./fedex";

describe("Cargobase to FedEx draft mapping", () => {
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
      "S123456789"
    );

    expect(draft.sender.country_code).toBe("MX");
    expect(draft.recipient.country_code).toBe("US");
    expect(draft.packages[0].weight_units).toBe("KG");
    expect(draft.packages[0].dimension_units).toBe("CM");
    expect(draft.packages[0].customs_items).toHaveLength(2);
    expect(draft.packages[0].customs_items[1].hs_code).toBe("654321");
    expect(draft.recipient_email).toBe("requestor@example.com");
    expect(draft.ship_date).toBe("2026-11-18");
    expect(isInternationalFedexDraft(draft)).toBe(true);
  });
});

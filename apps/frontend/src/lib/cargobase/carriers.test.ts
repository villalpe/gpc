import { describe, expect, it } from "vitest";
import { carrierAvailability, skydropxPrefillFromCargobase } from "./carriers";

const cb = (origin: string, destination: string, goods: unknown[] = []) => ({
  schedule: {
    pickup_country_code: origin,
    pickup_zipcode: "64000",
    pickup_city: "Monterrey",
    stop1_country_code: destination,
    stop1_zipcode: "06600",
    stop1_city: "CDMX",
  },
  organization: { good_items: goods },
});

describe("carrierAvailability", () => {
  it.each([
    ["MX", "MX", { skydropx: true, fedex: false, dhl: false }],
    ["US", "US", { skydropx: false, fedex: true, dhl: false }],
    ["MX", "US", { skydropx: false, fedex: true, dhl: true }],
    ["US", "MX", { skydropx: false, fedex: true, dhl: true }],
    ["DE", "MX", { skydropx: false, fedex: true, dhl: true }],
    ["US", "CA", { skydropx: false, fedex: true, dhl: false }],
    ["CA", "CA", { skydropx: false, fedex: false, dhl: false }],
    ["", "MX", { skydropx: false, fedex: false, dhl: false }],
  ])("%s -> %s", (origin, destination, expected) => {
    expect(carrierAvailability(cb(origin, destination))).toMatchObject(expected);
  });
});

describe("skydropxPrefillFromCargobase", () => {
  it("copies addresses and converts inches and pounds to centimeters and kilograms", () => {
    const prefill = skydropxPrefillFromCargobase(cb("MX", "MX", [
      { units: 2, weight: 10, w_unit: "lb", length: 10, width: 5, height: 2, m_unit: "in" },
      { units: 1, weight: 3, w_unit: "kg", length: 30, width: 20, height: 10, m_unit: "cm" },
    ]));
    expect(prefill.origin).toMatchObject({ country: "MX", zip: "64000", city: "Monterrey" });
    expect(prefill.destination).toMatchObject({ zip: "06600" });
    expect(prefill.parcels).toHaveLength(3);
    expect(prefill.parcels[0]).toEqual({ length: "25.4", width: "12.7", height: "5.08", weight: "4.536" });
    expect(prefill.parcels[2]).toEqual({ length: "30", width: "20", height: "10", weight: "3" });
  });
});

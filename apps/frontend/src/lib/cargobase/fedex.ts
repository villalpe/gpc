type Obj = Record<string, unknown>;

const FEDEX_DROPOFF = "DROPOFF_AT_FEDEX_LOCATION";

export type FedexParty = {
  company_name: string;
  person_name: string;
  phone_number: string;
  email_address: string;
  street_lines: string[];
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
};

export type FedexCommodity = {
  description: string;
  hs_code: string;
  origin_country: string;
  quantity: string;
  weight: string;
  weight_units: string;
  customs_value: string;
  customs_currency: string;
};

export type FedexPackage = {
  quantity: string;
  weight: string;
  weight_units: string;
  length: string;
  width: string;
  height: string;
  dimension_units: string;
  customs_items: FedexCommodity[];
};

export type FedexDraft = {
  cb_number: string;
  ship_date: string;
  service_type: string;
  pickup_type: string;
  packaging_type: string;
  payment_type: string;
  payment_account_number: string;
  duties_payment_type: string;
  duties_account_number: string;
  recipient_email: string;
  sender: FedexParty;
  recipient: FedexParty;
  packages: FedexPackage[];
};

export function fedexDomesticShipmentPayload(draft: FedexDraft) {
  return {
    ...draft,
    pickup_type: FEDEX_DROPOFF,
    duties_payment_type: undefined,
    duties_account_number: undefined,
    packages: draft.packages.map((item) => ({
      ...item,
      customs_items: undefined,
    })),
  };
}

export function fedexRateQuoteKey(draft: FedexDraft): string {
  const party = (value: FedexParty) => ({
    country_code: value.country_code.trim(),
    postal_code: value.postal_code.trim(),
    city: value.city.trim(),
    state: value.state.trim(),
  });
  return JSON.stringify({
    pickup_type: draft.pickup_type,
    packaging_type: draft.packaging_type.trim(),
    sender: party(draft.sender),
    recipient: party(draft.recipient),
    packages: draft.packages.map((item) => ({
      quantity: item.quantity,
      weight: item.weight,
      weight_units: item.weight_units,
      length: item.length,
      width: item.width,
      height: item.height,
      dimension_units: item.dimension_units,
    })),
  });
}

const isObj = (value: unknown): value is Obj =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function get(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (current, key) => (isObj(current) ? current[key] : undefined),
    value
  );
}

function first(...values: unknown[]): unknown {
  return values.find((value) => value !== null && value !== undefined && value !== "");
}

function string(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function unit(value: unknown, accepted: Record<string, string>): string {
  const normalized = string(value).toUpperCase().replace(/[^A-Z]/g, "");
  return accepted[normalized] ?? "";
}

function party(root: unknown, point: "pickup" | "stop1"): FedexParty {
  const schedule = (field: string) => get(root, `schedule.${point}_${field}`);
  const address = (field: string) => get(root, `schedule.address_v2.${point}.${field}`);
  const company = string(
    first(schedule("address_name"), address("name"), address("address_name"))
  );
  const contact = string(
    first(schedule("contact_name"), schedule("contact"), address("contact_name"))
  );
  const rawStreet = first(
    schedule("street"),
    address("street"),
    address("street_address"),
    schedule("address")
  );

  const countryCode = string(
    first(schedule("country_code"), address("country_code"), schedule("country"))
  ).toUpperCase();
  const rawState = string(
    first(schedule("state_code"), schedule("state"), address("state_code"), address("state"))
  );
  const state = countryCode === "US" && /^US-[A-Z]{2}$/i.test(rawState)
    ? rawState.slice(3).toUpperCase()
    : rawState;

  return {
    company_name: company || contact,
    person_name: contact || company,
    phone_number: string(
      first(schedule("contact_phone"), schedule("phone"), address("phone"))
    ),
    email_address: string(
      first(schedule("contact_email"), schedule("email"), address("email"))
    ),
    street_lines: string(rawStreet)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3),
    city: string(first(schedule("city"), address("city"), address("city_name"))),
    state,
    postal_code: string(
      first(schedule("zipcode"), schedule("postal_code"), address("zipcode"))
    ),
    country_code: countryCode,
  };
}

const WEIGHT_UNITS: Record<string, string> = {
  KG: "KG",
  KGS: "KG",
  KILOGRAM: "KG",
  KILOGRAMS: "KG",
  LB: "LB",
  LBS: "LB",
  POUND: "LB",
  POUNDS: "LB",
};

function weightInPounds(weight: unknown, weightUnit: unknown) {
  const raw = string(weight);
  const units = unit(weightUnit, WEIGHT_UNITS);
  if (!raw) return { weight: raw, weight_units: units };
  if (units !== "KG") return { weight: raw, weight_units: units };
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) return { weight: raw, weight_units: units };
  return { weight: String(Math.round(number * 2.20462 * 100) / 100), weight_units: "LB" };
}

function commodityFromItem(value: unknown, item: Obj, usePackageValues: boolean) {
  const customs = isObj(value) ? value : {};
  const commodityWeight = weightInPounds(
    first(customs.weight, usePackageValues ? item.weight : ""),
    first(customs.weight_units, customs.w_unit, usePackageValues ? item.w_unit : "")
  );
  return {
    description: string(customs.description),
    hs_code: string(customs.hs_code),
    origin_country: string(customs.origin_country).toUpperCase(),
    quantity: string(first(customs.quantity, usePackageValues ? item.units : "")),
    ...commodityWeight,
    customs_value: string(customs.value),
    customs_currency: string(customs.currency_code).toUpperCase(),
  };
}

function packageFromItem(value: unknown): FedexPackage {
  const item = isObj(value) ? value : {};
  const rawCustoms = item.good_customs_information;
  const customsEntries = Array.isArray(rawCustoms)
    ? rawCustoms.filter(isObj)
    : isObj(rawCustoms)
      ? [rawCustoms]
      : [];
  const customsItems = customsEntries.length
    ? customsEntries.map((customs) =>
        commodityFromItem(customs, item, customsEntries.length === 1)
      )
    : [
        commodityFromItem(
          {},
          item,
          true
        ),
      ];

  const dimensionsUnit = unit(item.m_unit, {
    CM: "CM", CMS: "CM", CENTIMETER: "CM", CENTIMETERS: "CM",
    IN: "IN", INCH: "IN", INCHES: "IN",
  });
  const dimension = (value: unknown) => {
    const raw = string(value);
    if (dimensionsUnit !== "CM" || !raw) return raw;
    const number = Number(raw);
    if (!Number.isFinite(number) || number <= 0) return raw;
    return String(Math.max(1, Math.round(number / 2.54)));
  };
  const packageWeight = weightInPounds(item.weight, item.w_unit);
  return {
    quantity: string(first(item.units, "1")),
    ...packageWeight,
    length: dimension(item.length),
    width: dimension(item.width),
    height: dimension(item.height),
    dimension_units: dimensionsUnit === "CM" ? "IN" : dimensionsUnit,
    customs_items: customsItems,
  };
}

export function fedexDraftFromCargobase(
  root: unknown,
  cbNumber: string,
  today = new Date()
): FedexDraft {
  const rawPackages = get(root, "organization.good_items");
  const packages = Array.isArray(rawPackages)
    ? rawPackages.map(packageFromItem)
    : [];
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return {
    cb_number: cbNumber,
    ship_date: `${year}-${month}-${day}`,
    service_type: "",
    pickup_type: FEDEX_DROPOFF,
    packaging_type: "YOUR_PACKAGING",
    payment_type: "",
    payment_account_number: "",
    duties_payment_type: "",
    duties_account_number: "",
    recipient_email: string(get(root, "organization.requestor_email")),
    sender: party(root, "pickup"),
    recipient: party(root, "stop1"),
    packages,
  };
}

export function isInternationalFedexDraft(draft: FedexDraft): boolean {
  return Boolean(
    draft.sender.country_code &&
      draft.recipient.country_code &&
      draft.sender.country_code.toUpperCase() !==
        draft.recipient.country_code.toUpperCase()
  );
}

type Obj = Record<string, unknown>;

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
    state: string(
      first(
        schedule("state_code"),
        schedule("state"),
        address("state_code"),
        address("state")
      )
    ),
    postal_code: string(
      first(schedule("zipcode"), schedule("postal_code"), address("zipcode"))
    ),
    country_code: string(
      first(
        schedule("country_code"),
        address("country_code"),
        schedule("country")
      )
    ).toUpperCase(),
  };
}

function commodityFromItem(value: unknown, item: Obj, usePackageValues: boolean) {
  const customs = isObj(value) ? value : {};
  return {
    description: string(customs.description),
    hs_code: string(customs.hs_code),
    origin_country: string(customs.origin_country).toUpperCase(),
    quantity: string(first(customs.quantity, usePackageValues ? item.units : "")),
    weight: string(first(customs.weight, usePackageValues ? item.weight : "")),
    weight_units: unit(
      first(
        customs.weight_units,
        customs.w_unit,
        usePackageValues ? item.w_unit : ""
      ),
      {
      KG: "KG",
      KGS: "KG",
      KILOGRAM: "KG",
      KILOGRAMS: "KG",
      LB: "LB",
      LBS: "LB",
      POUND: "LB",
      POUNDS: "LB",
      }
    ),
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

  return {
    quantity: string(first(item.units, "1")),
    weight: string(item.weight),
    weight_units: unit(item.w_unit, {
      KG: "KG",
      KGS: "KG",
      KILOGRAM: "KG",
      KILOGRAMS: "KG",
      LB: "LB",
      LBS: "LB",
      POUND: "LB",
      POUNDS: "LB",
    }),
    length: string(item.length),
    width: string(item.width),
    height: string(item.height),
    dimension_units: unit(item.m_unit, {
      CM: "CM",
      CMS: "CM",
      CENTIMETER: "CM",
      CENTIMETERS: "CM",
      IN: "IN",
      INCH: "IN",
      INCHES: "IN",
    }),
    customs_items: customsItems,
  };
}

export function fedexDraftFromCargobase(
  root: unknown,
  cbNumber: string
): FedexDraft {
  const rawPackages = get(root, "organization.good_items");
  const packages = Array.isArray(rawPackages)
    ? rawPackages.map(packageFromItem)
    : [];
  const pickupDate = string(
    first(
      get(root, "schedule.pickup_datetime"),
      get(root, "schedule.pickup_date_time"),
      get(root, "schedule.pickup_date")
    )
  );

  return {
    cb_number: cbNumber,
    ship_date: /^\d{4}-\d{2}-\d{2}/.test(pickupDate)
      ? pickupDate.slice(0, 10)
      : "",
    service_type: "",
    pickup_type: "",
    packaging_type: "",
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

export type SheetRow = { label: string; value: string };

export type SheetGroup = {
  heading?: string;
  rows: SheetRow[];
  customsRows?: string[][];
};

export type SheetSection = {
  title: string;
  groups: SheetGroup[];
};

export type Sheet = {
  shipmentId: string;
  title: string;
  sections: SheetSection[];
};

type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isEmpty = (value: unknown) =>
  value === null || value === undefined || value === "";

function get(root: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (current, key) => (isObj(current) ? current[key] : undefined),
      root
    );
}

function first(...values: unknown[]): unknown {
  return values.find((value) => !isEmpty(value));
}

function text(value: unknown): string {
  if (isEmpty(value)) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return String(value);
}

function yesNo(value: unknown): string {
  return typeof value === "boolean" ? (value ? "Yes" : "No") : "-";
}

function join(parts: unknown[], separator = ", "): string {
  const values = parts.filter((part) => !isEmpty(part)).map(String);
  return values.length ? values.join(separator) : "-";
}

function numberValue(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(number: number): string {
  return String(Number(number.toFixed(3)));
}

function formatDate(value: unknown): string {
  if (isEmpty(value)) return "-";

  const raw = String(value);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");
}

function getPoint(root: unknown, prefix: "pickup" | "stop1") {
  const scheduleValue = (key: string) =>
    get(root, `schedule.${prefix}_${key}`);
  const addressValue = (key: string) =>
    get(root, `schedule.address_v2.${prefix}.${key}`);

  return {
    name: first(
      scheduleValue("address_name"),
      addressValue("name"),
      addressValue("address_name")
    ),
    contact: first(scheduleValue("contact_name"), scheduleValue("contact")),
    phone: first(scheduleValue("contact_phone"), scheduleValue("phone")),
    email: first(scheduleValue("contact_email"), scheduleValue("email")),
    street: first(
      scheduleValue("street"),
      addressValue("street"),
      addressValue("street_address")
    ),
    city: first(
      scheduleValue("city"),
      addressValue("city"),
      addressValue("city_name")
    ),
    zipcode: first(scheduleValue("zipcode"), addressValue("zipcode")),
    state: first(scheduleValue("state"), addressValue("state")),
    country: first(
      scheduleValue("country"),
      addressValue("country"),
      addressValue("country_name")
    ),
    datetime: first(scheduleValue("datetime"), scheduleValue("date_time")),
  };
}

export function buildSheet(root: unknown): Sheet {
  const organizationValue = (key: string) =>
    get(root, `organization.${key}`);
  const serviceValue = (key: string) => get(root, `service.${key}`);

  const rawItems = organizationValue("good_items");
  const items: Obj[] = Array.isArray(rawItems)
    ? rawItems.filter(isObj)
    : [];

  const customsInfoList = (item: Obj): Obj[] => {
    const value = get(item, "good_customs_information");
    const entries = Array.isArray(value) ? value : [value];

    return entries.filter(
      (entry): entry is Obj =>
        isObj(entry) &&
        [
          entry.value,
          entry.currency_code,
          entry.hs_code,
          entry.description,
          entry.origin_country,
        ].some((field) => !isEmpty(field))
    );
  };

  const customsEntries = items.flatMap(customsInfoList);
  const primaryCustomsInfo = customsEntries[0];

  const pickup = getPoint(root, "pickup");
  const delivery = getPoint(root, "stop1");

  const specialRequirements = serviceValue("special_requirements_json");
  const bondedRequirement = isObj(specialRequirements)
    ? Object.entries(specialRequirements).find(([key, requirement]) =>
        /bond/i.test(
          `${key} ${isObj(requirement) ? String(requirement.label ?? "") : ""}`
        )
      )
    : undefined;

  const freightModes = first(
    get(root, "service.available_teams.supported_freight_modes"),
    serviceValue("invited_freight_modes")
  );

  const totalPackages = items.reduce(
    (total, item) => total + numberValue(item.units),
    0
  );
  const totalWeight = items.reduce(
    (total, item) =>
      total + numberValue(item.units) * numberValue(item.weight),
    0
  );
  const totalCbm = items.reduce(
    (total, item) => total + numberValue(item.total_cbm),
    0
  );
  const totalCustomsValue = customsEntries.reduce(
    (total, customs) => total + numberValue(customs.value),
    0
  );
  const customsCurrency = first(
    ...customsEntries.map((customs) => customs.currency_code)
  );

  const organizationGroup: SheetGroup = {
    rows: [
      { label: "Shipper", value: text(organizationValue("shipper")) },
      {
        label: "Created By",
        value: isEmpty(organizationValue("requestor"))
          ? "-"
          : `${organizationValue("requestor")}${
              isEmpty(organizationValue("requestor_email"))
                ? ""
                : ` (${organizationValue("requestor_email")})`
            }`,
      },
      {
        label: "Creation Date",
        value: formatDate(organizationValue("request_creation_datetime")),
      },
      {
        label: "Shipment title",
        value: text(organizationValue("title")),
      },
      {
        label: "Payment location",
        value: text(organizationValue("payment_location")),
      },
      {
        label: "Charge To (Please Select)",
        value: text(organizationValue("cost_center")),
      },
      {
        label: "Reason code",
        value: text(organizationValue("reason_code")),
      },
      {
        label: "Customer Name (Please Select)",
        value: text(organizationValue("custom_field1")),
      },
      {
        label: "Premium Freight ID",
        value: text(organizationValue("custom_field3")),
      },
    ],
  };

  const pickupGroup: SheetGroup = {
    rows: [
      { label: "Pickup company", value: text(pickup.name) },
      { label: "Pickup contact", value: text(pickup.contact) },
      { label: "Pickup contact phone", value: text(pickup.phone) },
      { label: "Pickup contact email", value: text(pickup.email) },
      { label: "Pickup address", value: text(pickup.street) },
      {
        label: "Pickup city and postal code",
        value: join([pickup.city, pickup.zipcode]),
      },
      {
        label: "Pickup state and country",
        value: join([pickup.state, pickup.country]),
      },
      {
        label: "Pickup ready date and time",
        value: formatDate(pickup.datetime),
      },
    ],
  };

  const deliveryGroup: SheetGroup = {
    rows: [
      { label: "Delivery company", value: text(delivery.name) },
      { label: "Delivery contact", value: text(delivery.contact) },
      { label: "Delivery contact phone", value: text(delivery.phone) },
      { label: "Delivery contact email", value: text(delivery.email) },
      { label: "Delivery address", value: text(delivery.street) },
      {
        label: "Delivery city and postal code",
        value: join([delivery.city, delivery.zipcode]),
      },
      {
        label: "Delivery state and country",
        value: join([delivery.state, delivery.country]),
      },
      {
        label: "Expected delivery date and time",
        value: formatDate(delivery.datetime),
      },
    ],
  };

  const serviceGroup: SheetGroup = {
    rows: [
      { label: "Freight mode", value: text(freightModes) },
      {
        label: "Service requirement",
        value: text(serviceValue("service_requirement_display")),
      },
      { label: "Incoterms", value: text(serviceValue("incoterm")) },
      {
        label: "Export clearance",
        value: text(serviceValue("export_clearance")),
      },
      {
        label: "Transit clearance",
        value: text(serviceValue("transit_clearance")),
      },
      {
        label: "Import clearance",
        value: text(serviceValue("import_clearance")),
      },
      {
        label: "Bonded",
        value:
          bondedRequirement && isObj(bondedRequirement[1])
            ? yesNo(bondedRequirement[1].value)
            : "-",
      },
    ],
  };

  const packingTotalsGroup: SheetGroup = {
    rows: [
      {
        label: "Total packages",
        value: items.length ? formatNumber(totalPackages) : "-",
      },
      {
        label: "Total weight",
        value: items.length
          ? join([formatNumber(totalWeight), items[0]?.w_unit], " ")
          : "-",
      },
      {
        label: "Total CBM",
        value: items.length ? `${formatNumber(totalCbm)} m³` : "-",
      },
      {
        label: "Total customs value",
        value: customsEntries.length
          ? join([formatNumber(totalCustomsValue), customsCurrency], " ")
          : "0",
      },
    ],
  };

  const commodityGroups: SheetGroup[] = items.map((item, index) => {
    const rows: SheetRow[] = [
      { label: "Handling unit", value: text(item.handling_unit) },
      {
        label: "LxWxH",
        value:
          isEmpty(item.length) && isEmpty(item.width) && isEmpty(item.height)
            ? "-"
            : join(
                [
                  `${text(item.length)} x ${text(item.width)} x ${text(item.height)}`,
                  item.m_unit,
                ],
                " "
              ),
      },
      {
        label: "Unit weight",
        value: join([item.weight, item.w_unit], " "),
      },
      { label: "Quantity", value: text(item.units) },
      { label: "Stackable", value: yesNo(item.stackable) },
      { label: "Hazardous", value: yesNo(item.hazardous) },
      {
        label: "Dangerous goods",
        value: yesNo(item.is_dangerous_good),
      },
    ];

    if (index !== 0 || !primaryCustomsInfo) {
      return { heading: `Commodity ${index + 1}`, rows };
    }

    const customsValue = primaryCustomsInfo.value;
    const customsCurrencyCode = primaryCustomsInfo.currency_code;
    const customsTotal = join([customsValue, customsCurrencyCode], " ");

    return {
      heading: "Commodity 1",
      rows,
      customsRows: [
        ["Customs information", text(customsValue), customsTotal],
        ["", "HS Code", text(primaryCustomsInfo.hs_code)],
        ["", "Total Value", customsTotal],
      ],
    };
  });

  return {
    shipmentId: text(organizationValue("shipment_id")),
    title: text(organizationValue("title")),
    sections: [
      {
        title: "Organisational details",
        groups: [organizationGroup],
      },
      {
        title: "Schedule",
        groups: [pickupGroup, deliveryGroup],
      },
      {
        title: "Service",
        groups: [serviceGroup],
      },
      {
        title: "Packing list",
        groups: [packingTotalsGroup, ...commodityGroups],
      },
    ],
  };
}
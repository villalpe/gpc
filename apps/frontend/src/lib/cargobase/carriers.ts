import { fedexDraftFromCargobase } from "./fedex";

type Obj = Record<string, unknown>;

export type CarrierAvailability = {
  origin: string;
  destination: string;
  skydropx: boolean;
  fedex: boolean;
  dhl: boolean;
  message: string;
};

export type SkydropxPrefill = {
  origin: { country: string; zip: string; state: string; city: string };
  destination: { country: string; zip: string; state: string; city: string };
  parcels: { length: string; width: string; height: string; weight: string }[];
};

export const SKYDROPX_PREFILL_KEY = "gpc:skydropx-prefill";

const isObj = (value: unknown): value is Obj =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function carrierAvailability(root: unknown, cbNumber = ""): CarrierAvailability {
  const draft = fedexDraftFromCargobase(root, cbNumber);
  const origin = draft.sender.country_code.toUpperCase();
  const destination = draft.recipient.country_code.toUpperCase();
  const none = { origin, destination, skydropx: false, fedex: false, dhl: false };

  if (!/^[A-Z]{2}$/.test(origin) || !/^[A-Z]{2}$/.test(destination)) {
    return { ...none, message: "No se pudo determinar el país de origen y destino del CB." };
  }
  if (origin === "MX" && destination === "MX") {
    return { ...none, skydropx: true, message: "Envío nacional: disponible Skydropx." };
  }
  if (origin === destination) {
    return origin === "US"
      ? { ...none, fedex: true, message: "Envío doméstico en EE. UU.: disponible FedEx." }
      : { ...none, message: `Envíos domésticos en ${origin} no están disponibles en esta etapa.` };
  }
  const involvesMexico = origin === "MX" || destination === "MX";
  return {
    ...none,
    fedex: true,
    dhl: involvesMexico,
    message: involvesMexico
      ? "Envío internacional desde o hacia México: disponibles FedEx y DHL."
      : "Envío internacional: disponible FedEx.",
  };
}

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return String(Math.round(value * factor) / factor);
}

export function skydropxPrefillFromCargobase(root: unknown): SkydropxPrefill {
  const draft = fedexDraftFromCargobase(root, "");
  const place = (party: typeof draft.sender) => ({
    country: party.country_code.toUpperCase(),
    zip: party.postal_code,
    state: party.state,
    city: party.city,
  });
  const goods = isObj(root) && isObj(root.organization) && Array.isArray(root.organization.good_items)
    ? root.organization.good_items.filter(isObj)
    : [];
  const parcels = goods.flatMap((item) => {
    const inches = /^(in|inch|inches)$/i.test(String(item.m_unit ?? "").trim());
    const pounds = /^(lb|lbs|pound|pounds)$/i.test(String(item.w_unit ?? "").trim());
    const dimension = (value: unknown) => {
      const number = toNumber(value);
      return number ? round(inches ? number * 2.54 : number, 2) : "";
    };
    const weight = toNumber(item.weight);
    const quantity = Math.min(Math.max(Math.trunc(toNumber(item.units)) || 1, 1), 40);
    const parcel = {
      length: dimension(item.length),
      width: dimension(item.width),
      height: dimension(item.height),
      weight: weight ? round(pounds ? weight * 0.45359237 : weight, 3) : "",
    };
    return Array.from({ length: quantity }, () => ({ ...parcel }));
  });
  return { origin: place(draft.sender), destination: place(draft.recipient), parcels };
}

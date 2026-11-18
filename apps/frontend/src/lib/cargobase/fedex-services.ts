export type FedexRoute = "domestic" | "international" | "unknown";

type Service = {
  label: string;
  code?: string;
  reason?: string;
};

const domestic: Service[] = [
  { label: "FedEx First Overnight®", code: "FIRST_OVERNIGHT" },
  { label: "FedEx Priority Overnight®", code: "PRIORITY_OVERNIGHT" },
  { label: "FedEx Standard Overnight®", code: "STANDARD_OVERNIGHT" },
  { label: "FedEx 2Day®", code: "FEDEX_2_DAY" },
  { label: "FedEx Express Saver®", code: "FEDEX_EXPRESS_SAVER" },
  { label: "FedEx 1 Day® Freight (Express)", reason: "Carga, fuera del alcance inicial" },
  { label: "FedEx 2 Day® Freight (Express)", reason: "Carga, fuera del alcance inicial" },
  { label: "FedEx 3 Day® Freight (Express)", reason: "Carga, fuera del alcance inicial" },
  { label: "FedEx® First", code: "FEDEX_FIRST" },
  { label: "FedEx® Priority Express", code: "FEDEX_PRIORITY_EXPRESS" },
  { label: "FedEx® Priority", reason: "Código por confirmar" },
  { label: "FedEx® Priority Express Freight", reason: "Carga, fuera del alcance inicial" },
  { label: "FedEx® Priority Freight", reason: "Carga, fuera del alcance inicial" },
  { label: "FedEx® Economy", reason: "Código por confirmar" },
];

const international: Service[] = [
  { label: "International First Overnight de FedEx", reason: "Código por confirmar" },
  { label: "International Priority (IP)", code: "INTERNATIONAL_PRIORITY" },
  { label: "FedEx International Priority®", code: "FEDEX_INTERNATIONAL_PRIORITY" },
  { label: "FedEx® Regional Economy", reason: "Código por confirmar" },
  { label: "FedEx® Regional Economy Freight", reason: "Carga, fuera del alcance inicial" },
  {
    label: "FedEx International Priority® Express",
    code: "FEDEX_INTERNATIONAL_PRIORITY_EXPRESS",
  },
  { label: "FedEx International Priority Overnight", reason: "Código por confirmar" },
  { label: "FedEx International Economy®", code: "INTERNATIONAL_ECONOMY" },
  { label: "FedEx International Connect Plus (FICP)", code: "FEDEX_INTERNATIONAL_CONNECT_PLUS" },
  { label: "Servicio FedEx International Priority® Freight", reason: "Carga, fuera del alcance inicial" },
  { label: "Servicio FedEx International Economy® Freight", reason: "Carga, fuera del alcance inicial" },
  { label: "FedEx Europe First®", reason: "Código por confirmar" },
  { label: "FedEx First Overnight® Freight", reason: "Carga, fuera del alcance inicial" },
  { label: "FedEx 2Day® AM", code: "FEDEX_2_DAY_AM" },
  { label: "FedEx International Priority DirectDistribution Freight (IDF)", reason: "Carga, fuera del alcance inicial" },
  { label: "FedEx International Priority DirectDistribution (IPD)", reason: "Flujo de distribución por definir" },
  { label: "FedEx International Economy DirectDistribution (IED)", reason: "Flujo de distribución por definir" },
  { label: "FedEx Transborder Distribution Canadá (TD CA): Express", reason: "Flujo de distribución por definir" },
  { label: "FedEx Transborder Distribution México (TD MX): Express", reason: "Flujo de distribución por definir" },
];

export function fedexRoute(origin: string, destination: string): FedexRoute {
  const first = origin.trim().toUpperCase();
  const second = destination.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(first) || !/^[A-Z]{2}$/.test(second)) return "unknown";
  return first === second ? "domestic" : "international";
}

export function fedexServices(route: FedexRoute): Service[] {
  if (route === "domestic") return domestic;
  if (route === "international") return international;
  return [];
}

export function cargobaseFetch(path: string) {
  const base = process.env.CARGOBASE_BASE_URL;
  const token = process.env.CARGOBASE_API_TOKEN;
  if (!base || !token) throw new Error("Cargobase no está configurado.");

  return fetch(`${base}${path}`, {
    headers: { Authorization: `Token ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
}
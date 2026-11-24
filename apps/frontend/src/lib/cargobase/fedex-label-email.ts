import { rateValidationErrors } from "./fedex-rate-errors";

export async function sendFedexLabelEmail(
  cbNumber: string,
  trackingNumber: string,
  recipientEmail: string
) {
  const response = await fetch("/api/fedex/shipments/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cb_number: cbNumber,
      tracking_number: trackingNumber,
      recipient_email: recipientEmail,
    }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      rateValidationErrors(data).join(" ") ||
        "No se pudo enviar el correo con las etiquetas."
    );
  }
  if (!data || typeof data !== "object" || !("sent" in data) || data.sent !== true) {
    throw new Error("No se pudo confirmar el envío del correo.");
  }
}

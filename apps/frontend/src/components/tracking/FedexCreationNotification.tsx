"use client";

import { useState } from "react";

export type NotificationStatus = "not_requested" | "pending" | "sending" | "sent" | "failed";

const descriptions: Record<NotificationStatus, string> = {
  not_requested: "Aviso de creación: no solicitado al crear la guía.",
  pending: "Aviso de creación: pendiente.",
  sending: "Aviso de creación: envío en proceso o sin confirmar.",
  sent: "Aviso de prueba aceptado por el servidor de correo; verifica la bandeja de prueba.",
  failed: "Aviso de prueba no confirmado. La guía sigue creada.",
};

export default function FedexCreationNotification({
  shipmentId, initialStatus, initialError, canRetry = true,
}: {
  shipmentId: number;
  initialStatus: NotificationStatus;
  initialError: string;
  canRetry?: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [detail, setDetail] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    if (!window.confirm(
      "El aviso anterior podría haber llegado aunque no se confirmara. Verifica la bandeja de prueba antes de reintentar; podrías recibir un duplicado. ¿Continuar?"
    )) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/fedex/shipments/${shipmentId}/retry-notification`, {
        method: "POST",
      });
      const data = await response.json() as {
        detail?: string; notification_status?: NotificationStatus; notification_error?: string;
      };
      if (data.notification_status) setStatus(data.notification_status);
      if (data.notification_error !== undefined) setDetail(data.notification_error);
      if (!response.ok) throw new Error(data.detail || "No se pudo reintentar el aviso.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo confirmar el aviso.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 text-sm">
      <p role="status">{descriptions[status]}</p>
      {detail && <p className="text-amber-700 dark:text-amber-200">{detail}</p>}
      {canRetry && (status === "pending" || status === "failed" || status === "sending") && (
        <button type="button" onClick={retry} disabled={busy}
          className="rounded-lg border border-amber-500 px-3 py-1.5 font-semibold disabled:opacity-50">
          {busy ? "Enviando aviso..." : "Reintentar aviso de creación"}
        </button>
      )}
      {status === "sending" && <p>Si sigue en proceso, espera cinco minutos antes de reintentar.</p>}
      {error && <p role="alert" className="text-rose-700 dark:text-rose-300">{error}</p>}
    </div>
  );
}

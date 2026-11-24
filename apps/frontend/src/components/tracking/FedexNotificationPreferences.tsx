"use client";

import { useEffect, useState } from "react";
import { rateValidationErrors } from "@/lib/cargobase/fedex-rate-errors";

type Recipient = {
  email: string;
  created: boolean;
  received: boolean;
  delivery_estimate: boolean;
  delivered: boolean;
};
type Group = "sender" | "recipient" | "other" | "requester";
type Preferences = Record<Group, Recipient>;
const groups: { key: Group; title: string }[] = [
  { key: "sender", title: "Correo del remitente" },
  { key: "recipient", title: "Correo del destinatario" },
  { key: "other", title: "Correo Otro" },
  { key: "requester", title: "Correo posterior a la creación" },
];
const events = [
  { key: "created", label: "Envío ha sido creado" },
  { key: "received", label: "Envío ha sido recibido por FedEx" },
  { key: "delivery_estimate", label: "Actualizaciones en estimados de entrega" },
  { key: "delivered", label: "Envío ha sido entregado" },
] as const;
function empty(email: string): Recipient {
  return { email, created: false, received: false, delivery_estimate: false, delivered: false };
}

export default function FedexNotificationPreferences({
  cbNumber, senderEmail, recipientEmail, requesterEmail, onRequesterEmailChange, onReadyChange,
}: {
  cbNumber: string;
  senderEmail: string;
  recipientEmail: string;
  requesterEmail: string;
  onRequesterEmailChange: (email: string) => void;
  onReadyChange: (ready: boolean) => void;
}) {
  const [preferences, setPreferences] = useState<Preferences>(() => ({
    sender: empty(senderEmail), recipient: empty(recipientEmail),
    other: empty("uslogistics@globalpackcenter.com"), requester: empty(requesterEmail),
  }));
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/fedex/preferences/${cbNumber}`);
        const data = await response.json();
        if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "No se pudieron cargar las preferencias.");
        if (active && data.preferences) {
          setPreferences(data.preferences);
          onRequesterEmailChange(data.preferences.requester.email);
        }
        if (active) onReadyChange(true);
      } catch (error) {
        if (active) {
          setLoadFailed(true);
          setMessage(error instanceof Error ? error.message : "No se pudieron cargar las preferencias.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [cbNumber, onRequesterEmailChange, onReadyChange]);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/fedex/preferences/${cbNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(rateValidationErrors(data).join(" ") || "No se pudieron guardar las preferencias.");
      onReadyChange(true);
      setMessage("Preferencias guardadas para este CB.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron guardar las preferencias.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-violet-300 bg-white shadow-sm dark:border-violet-400/40 dark:bg-white/[0.06]">
      <div className="border-b border-violet-200 bg-violet-100 px-5 py-3 text-violet-950 dark:border-violet-400/30 dark:bg-violet-900/40 dark:text-violet-100">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Notificaciones del envío</p>
        <h2 className="mt-0.5 text-lg font-bold">Preferencias de correo</h2>
      </div>
      <div className="space-y-4 p-5">
      <p className="text-sm text-amber-700 dark:text-amber-300">
        Guarda las preferencias antes de crear la guía. Si seleccionas «Envío ha sido creado»,
        se enviará un único aviso de prueba a la dirección configurada en el backend, nunca a
        estos contactos. Los demás avisos aún no se envían. Las etiquetas se envían por separado
        con el botón manual posterior a la creación. Los correos son independientes de las direcciones.
      </p>
      {groups.map(({ key, title }) => (
        <fieldset key={key} disabled={loading || loadFailed || saving} className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
          <legend className="font-semibold">{title}</legend>
          <label className="block text-sm font-medium">Correo electrónico
            <input type="email" value={preferences[key].email} readOnly={key === "other"}
              onChange={(event) => {
                const email = event.target.value;
                onReadyChange(false);
                setPreferences((current) => ({ ...current, [key]: { ...current[key], email } }));
                if (key === "requester") onRequesterEmailChange(email);
              }}
              className="mt-1 block w-full rounded-lg border-2 border-violet-300 bg-violet-50 px-3 py-2.5 text-base text-slate-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/25 dark:border-violet-400/60 dark:bg-violet-950/60 dark:text-white" />
          </label>
          {events.map(({ key: eventKey, label }) => (
            <label key={eventKey} className="block text-sm">
              <input type="checkbox" checked={preferences[key][eventKey]}
                onChange={(event) => {
                  onReadyChange(false);
                  setPreferences((current) => ({
                    ...current, [key]: { ...current[key], [eventKey]: event.target.checked },
                  }));
                }} /> {label}
            </label>
          ))}
        </fieldset>
      ))}
      <button type="button" onClick={save} disabled={loading || loadFailed || saving}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar preferencias de correo"}
      </button>
      {message && <p role="status" className="text-sm">{message}</p>}
      </div>
    </section>
  );
}

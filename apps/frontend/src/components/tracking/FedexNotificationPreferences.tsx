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
  cbNumber, senderEmail, recipientEmail, requesterEmail, onRequesterEmailChange,
}: {
  cbNumber: string;
  senderEmail: string;
  recipientEmail: string;
  requesterEmail: string;
  onRequesterEmailChange: (email: string) => void;
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
  }, [cbNumber, onRequesterEmailChange]);

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
      setMessage("Preferencias guardadas para este CB. No se enviarán avisos automáticos.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron guardar las preferencias.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/15 dark:bg-white/[0.06]">
      <h2 className="text-lg font-semibold">Preferencias de correo</h2>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        Estas opciones solo se guardan para este CB; no activan ni envían avisos automáticos.
        La guía se envía por separado, con el botón manual posterior a su creación.
        Revisa los correos antes de guardar; son independientes de los campos de dirección.
      </p>
      {groups.map(({ key, title }) => (
        <fieldset key={key} disabled={loading || loadFailed || saving} className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-white/10">
          <legend className="font-semibold">{title}</legend>
          <label className="block text-sm">Correo electrónico
            <input type="email" value={preferences[key].email} readOnly={key === "other"}
              onChange={(event) => {
                const email = event.target.value;
                setPreferences((current) => ({ ...current, [key]: { ...current[key], email } }));
                if (key === "requester") onRequesterEmailChange(email);
              }}
              className="ml-2 rounded-lg border border-slate-300 bg-white p-2 text-slate-900" />
          </label>
          {events.map(({ key: eventKey, label }) => (
            <label key={eventKey} className="block text-sm">
              <input type="checkbox" checked={preferences[key][eventKey]}
                onChange={(event) => setPreferences((current) => ({
                  ...current, [key]: { ...current[key], [eventKey]: event.target.checked },
                }))} /> {label}
            </label>
          ))}
        </fieldset>
      ))}
      <button type="button" onClick={save} disabled={loading || loadFailed || saving}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar preferencias de correo"}
      </button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </section>
  );
}

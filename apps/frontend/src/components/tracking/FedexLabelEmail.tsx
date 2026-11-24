"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { sendFedexLabelEmail } from "@/lib/cargobase/fedex-label-email";

export default function FedexLabelEmail({
  cbNumber, trackingNumber,
}: {
  cbNumber: string;
  trackingNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const recipient = email.trim();
    setSending(true);
    setError("");
    setNotice("");
    try {
      await sendFedexLabelEmail(cbNumber, trackingNumber, recipient);
      setNotice(`El servidor de correo aceptó el envío a ${recipient}.`);
      setOpen(false);
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : "No se pudo confirmar el envío.";
      setError(`${detail} Si no se confirmó, revisa la bandeja antes de reintentar para evitar duplicados.`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 min-w-56 space-y-2">
      {!open && (
        <button type="button" onClick={() => { setOpen(true); setNotice(""); }}
          className="inline-flex items-center gap-1 rounded-lg border border-[#C1374A] px-2 py-1 text-xs font-semibold text-[#C1374A]">
          <Mail className="h-3.5 w-3.5" /> Enviar etiquetas por correo
        </button>
      )}
      {open && (
        <form onSubmit={send} className="space-y-2">
          <label className="block text-xs font-medium">
            Correo para las etiquetas
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)}
              disabled={sending} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-white" />
          </label>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Se enviarán los PDF al correo indicado, no necesariamente a la cuenta de prueba.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={sending}
              className="rounded-lg bg-[#C1374A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {sending ? "Enviando..." : "Enviar PDF"}
            </button>
            <button type="button" disabled={sending} onClick={() => { setOpen(false); setError(""); }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 dark:border-white/20">
              Cancelar
            </button>
          </div>
        </form>
      )}
      {notice && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">{error}</p>}
    </div>
  );
}

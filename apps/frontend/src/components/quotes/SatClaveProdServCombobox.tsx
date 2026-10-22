"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

type Item = { clave: string; descripcion: string; vigente: boolean };

export default function SatClaveProdServCombobox({
  value,
  onSelect,
  label = "Clave producto/servicio SAT (8 dígitos)",
  placeholder = "Ej. 43211500 o buscar descripción",
}: {
  value: string;
  onSelect: (item: Item) => void;
  label?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value ?? ""), [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setItems([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sat/clave-prod-serv?q=${encodeURIComponent(q)}&limit=20`, {
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as { data?: Item[] } | null;
        setItems(json?.data ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const exact8 = useMemo(() => /^\d{8}$/.test((value || "").trim()), [value]);

  return (
    <div ref={boxRef} className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
        {label}
      </label>

      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-white/20 dark:bg-slate-900/60">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {!exact8 && value ? (
        <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-300">
          Debe ser una clave SAT de 8 dígitos.
        </p>
      ) : null}

      {open && (query.trim() || items.length > 0) && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-white/15 dark:bg-[#0B1220]">
          {loading ? (
            <p className="px-3 py-2 text-sm text-slate-500 dark:text-white/60">Buscando…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500 dark:text-white/60">Sin resultados</p>
          ) : (
            items.map((it) => (
              <button
                key={it.clave}
                type="button"
                onClick={() => {
                  onSelect(it);
                  setQuery(`${it.clave} - ${it.descripcion}`);
                  setOpen(false);
                }}
                className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
              >
                <p className="text-sm font-semibold">{it.clave}</p>
                <p className="text-xs text-slate-600 dark:text-white/70">{it.descripcion}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/lib/api";

interface Setor {
  id:   string;
  nome: string;
}

interface SetorAutocompleteProps {
  value:    string | null;
  onChange: (value: string | null) => void;
}

export function SetorAutocomplete({ value, onChange }: SetorAutocompleteProps) {
  const [setores, setSetores]         = useState<Setor[]>([]);
  const [query, setQuery]             = useState("");
  const [open, setOpen]               = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef                      = useRef<HTMLInputElement>(null);
  const containerRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ success: boolean; data: Setor[] }>("/setores")
      .then((r) => setSetores(r.data.data))
      .catch(() => {});
  }, []);

  const selectedSetor = setores.find((s) => s.id === value) ?? null;

  const filtered = setores
    .filter((s) => s.id !== value)
    .filter((s) =>
      query.trim()
        ? s.nome.toLowerCase().includes(query.trim().toLowerCase())
        : true
    );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(id: string) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (filtered.length > 0) setHighlighted((h) => (h + 1) % filtered.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (filtered.length > 0) setHighlighted((h) => (h - 1 + filtered.length) % filtered.length);
        break;
      case "Enter":
        e.preventDefault();
        if (open && filtered[highlighted]) select(filtered[highlighted].id);
        break;
      case "Escape":
        setOpen(false);
        setQuery("");
        break;
    }
  }

  useEffect(() => { setHighlighted(0); }, [query]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center min-h-[40px] px-3 py-2 rounded-xl border border-border/50 bg-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all cursor-text gap-2"
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {selectedSetor ? (
          <>
            <span className="flex-1 text-sm text-foreground">{selectedSetor.nome}</span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); clear(); }}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Remover setor"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Digite para buscar um setor..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </>
        )}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); inputRef.current?.focus(); }}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          tabIndex={-1}
        >
          <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && !selectedSetor && (
          <motion.ul
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900 border border-border/50 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground text-center">Nenhum setor encontrado.</li>
            ) : (
              filtered.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(s.id); }}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      i === highlighted
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {s.nome}
                  </button>
                </li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  value:    string[];
  onChange: (value: string[]) => void;
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

  const selectedSetores = setores.filter((s) => value.includes(s.id));

  const filtered = setores
    .filter((s) => !value.includes(s.id))
    .filter((s) =>
      query.trim() ? s.nome.toLowerCase().includes(query.trim().toLowerCase()) : true
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
    onChange([...value, id]);
    setQuery("");
    setHighlighted(0);
    inputRef.current?.focus();
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && query === "" && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setOpen(true); return; }
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
        className="flex flex-wrap gap-1.5 items-center min-h-[40px] px-3 py-2 rounded-xl border border-border/50 bg-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all cursor-text"
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {selectedSetores.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 shrink-0"
          >
            {s.nome}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); remove(s.id); }}
              className="text-primary/60 hover:text-primary transition-colors"
              aria-label={`Remover ${s.nome}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <div className="flex-1 flex items-center gap-1.5 min-w-[120px]">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? "Digite para buscar um setor..." : "Adicionar outro..."}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
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
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900 border border-border/50 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted-foreground text-center">
                {setores.length === value.length ? "Todos os setores já foram selecionados." : "Nenhum setor encontrado."}
              </li>
            ) : (
              filtered.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(s.id); }}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      i === highlighted ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-slate-50 dark:hover:bg-white/5"
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

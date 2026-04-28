"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const MapRio = dynamic(() => import("@/components/ui/MapRio"), { ssr: false });

export function FooterSection() {
  return (
    <footer className="relative overflow-hidden">
      {/* border-t gradiente */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#42b9eb]/30 to-transparent" />

      <div className="section-container">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-0"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Coluna esquerda — conteúdo */}
          <div className="py-12 pr-0 md:pr-10 flex flex-col gap-8">
            {/* Logos */}
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logobranca.png"
                alt="Prefeitura do Rio"
                width={100}
                height={32}
                className="object-contain"
              />
            </div>

            {/* Identidade */}
            <div className="flex flex-col gap-2">
              <p className="text-white/70 text-[13px] font-semibold">
                Secretaria Municipal de Saúde
              </p>
              <div className="flex items-start gap-2 text-white/40 text-[11px]">
                <MapPin size={12} className="text-[#42b9eb] shrink-0 mt-0.5" />
                <span>
                  Rua Afonso Cavalcanti, 455 — Cidade Nova · Rio de Janeiro
                </span>
              </div>
              <p className="text-white/30 text-[11px] leading-relaxed mt-1">
                Monitoramento contínuo das metas da gestão 2025–2026.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.07]" />

            {/* Sub-grid de links */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <h4 className="text-white/80 font-display font-semibold text-sm mb-1">
                  Navegação
                </h4>
                {[
                  { href: "#panorama", label: "Panorama Geral" },
                  { href: "#marcos", label: "Marcos Estratégicos" },
                  { href: "#planos", label: "Planos de Ação" },
                ].map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="text-[11px] text-white/35 hover:text-[#42b9eb] transition-colors w-fit"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Badge SUBG */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#42b9eb]/20 bg-[#42b9eb]/[0.06] text-[#42b9eb] text-[10px] font-mono tracking-wide">
                ⬡ SUBG · 2025–2026
              </span>
            </div>
          </div>

          {/* Coluna direita — mapa com card */}
          <div className="flex items-center py-8 md:py-10">
            <div className="relative w-full h-[280px] md:h-[420px] rounded-xl overflow-hidden
                            ring-1 ring-white/[0.08]
                            shadow-[0_0_40px_rgba(66,185,235,0.07),inset_0_0_0_1px_rgba(66,185,235,0.08)]">

              {/* Cantos tech (L-shapes) */}
              {/* top-left */}
              <span className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#42b9eb]/50 z-20 pointer-events-none" />
              {/* top-right */}
              <span className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#42b9eb]/50 z-20 pointer-events-none" />
              {/* bottom-left */}
              <span className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#42b9eb]/50 z-20 pointer-events-none" />
              {/* bottom-right */}
              <span className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#42b9eb]/50 z-20 pointer-events-none" />

              <MapRio />
            </div>
          </div>
        </motion.div>

        {/* Bottom bar — full width */}
        <div className="border-t border-white/[0.08] py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-white/20">
          <span>
            © {new Date().getFullYear()} Prefeitura do Rio · SMS. Todos os
            direitos reservados.
          </span>
          <span className="font-mono flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#42b9eb] animate-pulse"
              aria-hidden="true"
            />
            v2026
          </span>
        </div>
      </div>
    </footer>
  );
}

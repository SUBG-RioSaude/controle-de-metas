"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { motion } from "framer-motion";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

// Secretaria Municipal de Saúde do Rio de Janeiro
const RIO_LNG = -43.2058;
const RIO_LAT = -22.9108;

// Altura alvo: ~6° andar.
// O prédio no OSM tem render_height ≈ 18-22 m (5-6 andares).
// 10 m ≈ 3° andar visual — ajuste aqui para subir/descer o pin.
const TARGET_ALTITUDE_M = 10;

interface MapRioProps {
  height?: number;
}

interface PinPos {
  x: number;
  y: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcPinPos(map: maplibregl.Map): PinPos {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transform = (map as any).transform;

  const coordGround = maplibregl.MercatorCoordinate.fromLngLat(
    { lng: RIO_LNG, lat: RIO_LAT },
    0,
  );
  const coord1m = maplibregl.MercatorCoordinate.fromLngLat(
    { lng: RIO_LNG, lat: RIO_LAT },
    1,
  );

  const ptGround: { x: number; y: number } = transform.coordinatePoint(coordGround);
  const pt1m: { x: number; y: number } = transform.coordinatePoint(coord1m);

  const dy = ptGround.y - pt1m.y; // positivo = altitude sobe na tela (y decresce)

  let pxPerMeter: number;
  if (Math.abs(dy) > 0.05) {
    pxPerMeter = Math.abs(dy);
  } else {
    // coordinatePoint ignorou z → estima via worldSize (pitch=90, factor empírico)
    const worldSize: number = transform.worldSize ?? 512 * Math.pow(2, 17);
    pxPerMeter = (worldSize / 40075017) * 2.5;
  }

  return {
    x: ptGround.x,
    y: ptGround.y - pxPerMeter * TARGET_ALTITUDE_M,
  };
}

export default function MapRio({ height }: MapRioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pinPos, setPinPos] = useState<PinPos | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [RIO_LNG, RIO_LAT],
      zoom: 17,
      pitch: 90,
      bearing: 345,
      interactive: false,
      attributionControl: false,
    });

    const updatePin = () => setPinPos(calcPinPos(map));

    map.on("load", () => {
      map.addLayer({
        id: "3d-buildings",
        source: "openmaptiles",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 13,
        paint: {
          "fill-extrusion-color": "#0d2a4a",
          "fill-extrusion-height": ["get", "render_height"],
          "fill-extrusion-base": ["get", "render_min_height"],
          "fill-extrusion-opacity": 0.75,
        },
      });
      updatePin();
    });

    // Recalcula se o container mudar de tamanho (transições CSS, breakpoints, etc.)
    map.on("resize", updatePin);

    return () => map.remove();
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: height ? `${height}px` : "100%" }}
    >
      <div ref={containerRef} className="w-full h-full" />

      {/* Fade topo */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0d2035] to-transparent z-10 pointer-events-none" />

      {/* Pin — âncora inferior-central em pinPos (dot aponta para TARGET_ALTITUDE_M) */}
      {pinPos && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: pinPos.x,
            top: pinPos.y,
            transform: "translateX(-50%) translateY(-100%)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <div className="mb-1.5 px-2.5 py-1 rounded-md bg-[#0d2035]/90 border border-[#42b9eb]/40 backdrop-blur-sm shadow-lg">
                <p className="text-[9px] text-[#42b9eb] font-mono tracking-widest uppercase whitespace-nowrap">
                  SMS · Pref. Rio
                </p>
                <p className="text-[8px] text-white/50 font-mono whitespace-nowrap">
                  R. Afonso Cavalcanti, 455
                </p>
              </div>
              <div className="w-px h-5 bg-gradient-to-b from-[#42b9eb]/80 to-[#42b9eb]/20" />
              <div className="relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#42b9eb] z-10 shadow-[0_0_8px_#42b9eb]" />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#42b9eb] animate-ping opacity-40" />
                <div className="absolute w-6 h-6 rounded-full border border-[#42b9eb]/30 animate-pulse" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

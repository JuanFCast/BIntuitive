import type { CSSProperties } from "react";
import { HEXAGON_CLIP } from "@/lib/hexagon";

/**
 * La lluvia de confeti que celebra un acierto.
 *
 * Existe una sola vez: la usan el acierto de las lecciones (`FeedbackOverlay`)
 * y el final de un camino en Trazos. Se coloca contra el antepasado posicionado
 * más cercano, así que sirve igual sobre una pantalla completa que dentro de
 * una tarjeta.
 *
 * Las piezas son celdas del panal en los colores de la marca, no emoji: un
 * emoji se dibuja distinto en cada sistema, y las celdas dicen BIntuitive en
 * cualquiera. Cada una cae por su propio camino —sitio, deriva, giro, tamaño
 * y duración distintos—, porque doce piezas en fila a la misma velocidad se
 * leían como un mecanismo y no como una celebración.
 *
 * Los caminos salen de una semilla fija y no de `Math.random()`: así son
 * variados pero iguales en cada render, y un re-render a mitad de la caída no
 * hace saltar ninguna pieza.
 */
const COLORS = ["#ffc400", "#6ec6ff", "#7ddfa8", "#ff8a80", "#b388ff"];

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

const random = seeded(7);

const PIECES = Array.from({ length: 18 }, (_, index) => {
  const size = 10 + random() * 12;
  return {
    left: 3 + random() * 94,
    drift: random() * 80 - 40,
    spin: random() * 540 - 270,
    duration: 1.1 + random() * 0.5,
    delay: random() * 0.35,
    size,
    color: COLORS[index % COLORS.length],
  };
});

export default function Confetti() {
  return (
    <span
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {PIECES.map((piece, index) => (
        <span
          key={index}
          className="animate-fall absolute top-0"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size * 1.15,
              background: piece.color,
              clipPath: HEXAGON_CLIP,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--drift": `${piece.drift}px`,
              "--spin": `${piece.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

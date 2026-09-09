/**
 * La lluvia de confeti que celebra un acierto.
 *
 * Existe una sola vez: la usan el acierto de las lecciones (`FeedbackOverlay`)
 * y el final de un camino en Trazos. Se coloca contra el antepasado posicionado
 * más cercano, así que sirve igual sobre una pantalla completa que dentro de
 * una tarjeta.
 */
const PIECES = [
  "⭐",
  "🌟",
  "✨",
  "🎉",
  "💛",
  "⭐",
  "✨",
  "🌟",
  "🎉",
  "💛",
  "⭐",
  "✨",
];

export default function Confetti() {
  return (
    <span
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {PIECES.map((piece, index) => (
        <span
          key={index}
          className="animate-fall absolute top-0 text-3xl sm:text-4xl"
          style={{
            left: `${6 + index * 8}%`,
            animationDelay: `${(index % 5) * 0.12}s`,
          }}
        >
          {piece}
        </span>
      ))}
    </span>
  );
}

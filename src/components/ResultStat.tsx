/**
 * Tarjeta de una métrica de resultados.
 *
 * Cada juego mide lo suyo —palabras encontradas, precisión, tiempo, nivel—,
 * pero la tarjeta que lo enseña es la misma en todos: mismo contenedor, mismo
 * radio, mismo espaciado y misma jerarquía entre el número y su etiqueta. Solo
 * cambia el color del borde, que es la nota de identidad de cada juego.
 */

/** Color del borde. Son tokens de la paleta, no colores nuevos. */
export type ResultStatTone = "mint" | "berry" | "neutral";

const TONES: Record<ResultStatTone, string> = {
  mint: "border-mint",
  berry: "border-berry",
  neutral: "border-ink/10",
};

export default function ResultStat({
  label,
  value,
  tone = "mint",
}: {
  label: string;
  value: string | number;
  tone?: ResultStatTone;
}) {
  return (
    <div
      className={`rounded-2xl border-2 bg-white px-2 py-4 text-center shadow-sm ${TONES[tone]}`}
    >
      <p className="text-2xl font-extrabold tabular-nums text-ink sm:text-3xl">
        {value}
      </p>
      {/*
        La etiqueta puede ser larga en español —"Palabras encontradas"— y la
        columna es estrecha en un móvil. El espaciado entre letras se reserva
        para pantallas anchas, se le da interlineado cómodo para cuando ocupe
        dos o tres líneas, y se le permite partir palabras: antes que
        apretarlas, la tarjeta crece a lo alto.
      */}
      <p className="mt-1 hyphens-auto break-words text-xs font-bold uppercase leading-snug text-ink/50 sm:tracking-wide sm:text-sm">
        {label}
      </p>
    </div>
  );
}

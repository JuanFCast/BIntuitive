"use client";

import { useLanguage } from "@/lib/i18n";
import { MAX_STARS, type Stars } from "@/lib/difficulty";

/**
 * Las estrellas de la sesión en la pantalla de resultados, y el aviso de nivel
 * abierto si lo hubo.
 *
 * Van aparte y en grande a propósito. No son las marcas del juego —trazos,
 * aciertos, precisión—, que se enseñan en sus propias tarjetas: son la
 * valoración de la sesión entera, tres como mucho, y lo único que abre el
 * escalón siguiente. Compartir tarjeta con una marca haría leer una sesión de
 * 3 y quince estrellas de trazo como la misma cuenta.
 *
 * El aviso de nivel abierto solo sale cuando se acaba de abrir algo nuevo, no
 * cuando se repite un nivel que ya estaba abierto.
 */
export default function SessionStars({
  stars,
  openedLevel,
}: {
  stars: Stars;
  openedLevel: number | null;
}) {
  const { t } = useLanguage();

  return (
    <>
      <div
        className="flex flex-col items-center gap-1 rounded-3xl border-2 border-sun bg-sunsoft px-6 py-4 shadow-sm"
        role="img"
        aria-label={t("sessionStarsAria", { stars })}
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9b7400]">
          {t("sessionStars")}
        </p>
        <p className="text-4xl leading-none sm:text-5xl" aria-hidden="true">
          {Array.from({ length: MAX_STARS }, (_, index) =>
            index < stars ? "⭐" : "☆",
          ).join("")}
        </p>
      </div>

      {openedLevel && (
        <p
          className="break-words rounded-2xl border-2 border-mint bg-mintsoft px-4 py-2 text-base font-extrabold text-ink sm:text-lg"
          role="status"
        >
          {t("levelUnlockedMessage", { level: openedLevel })}
        </p>
      )}
    </>
  );
}

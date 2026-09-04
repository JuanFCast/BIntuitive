"use client";

import { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/lib/focusTrap";
import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/language";
import { useMuted, useTextSize } from "@/lib/preferences";
import { cancelSpeech } from "@/lib/speech";
import { setMuted, setTextSize, type TextSize } from "@/lib/storage";

/**
 * Menú compacto de preferencias globales: idioma, sonido, tamaño de texto y
 * Acerca de. Vive en `AppHeader`, así que existe una sola vez y aparece en las
 * tres pantallas principales.
 *
 * Es un diálogo, no un `role="menu"`: dentro hay ajustes con estado, no
 * acciones que se ejecutan y desaparecen. Elegir una opción no lo cierra,
 * porque es normal ajustar varias seguidas; se cierra con el propio botón, con
 * Escape o tocando fuera.
 *
 * Es modal de verdad, no solo de nombre: el fondo se oscurece y traga los
 * toques, así que el teclado se comporta igual y el foco no se escapa por
 * detrás mientras está abierto.
 *
 * El panel se monta en `document.body`, no dentro del encabezado. El
 * encabezado podria llevar un filtro, y un antepasado con filtro convierte
 * `position: fixed` en "relativo a ese antepasado": el panel se mediría contra
 * una franja de sesenta píxeles y el fondo oscuro no taparía la página. Desde
 * el `body` se mide contra la ventana en cualquier navegador, y además queda
 * por encima de la barra inferior.
 *
 * Ninguna preferencia se guarda aquí: idioma va por `useLanguage` y sonido y
 * texto por `storage.ts`. El menú solo las lee y las escribe.
 */
export default function AppMenu() {
  const { language, setLanguage, t } = useLanguage();
  const muted = useMuted();
  const textSize = useTextSize();
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setAboutOpen(false);
  }, []);

  // Foco atrapado, Escape y devolución del foco al botón: el mismo
  // comportamiento que los diálogos de confirmación.
  useFocusTrap(open, panelRef, close);

  const languages: { value: Language; label: string }[] = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
  ];

  const textSizes: { value: TextSize; label: string }[] = [
    { value: "normal", label: t("menuTextNormal") },
    { value: "large", label: t("menuTextLarge") },
    { value: "xlarge", label: t("menuTextXLarge") },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={t("menuAria")}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink/15 bg-white text-ink shadow-sm transition-transform active:scale-90"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          role="presentation"
          aria-hidden="true"
        >
          <path
            d="M4 7h16M4 12h16M4 17h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <>
            {/* Tocar fuera cierra. Va detrás del panel y no captura el teclado. */}
            <button
              type="button"
              aria-label={t("menuClose")}
              onClick={close}
              className="fixed inset-0 z-[59] cursor-default bg-ink/25"
            />

            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={t("menuTitle")}
              tabIndex={-1}
              className="app-menu-panel fixed right-3 z-[60] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl border-2 border-ink/10 bg-cream p-4 shadow-2xl outline-none sm:right-6"
            >
              <MenuGroup label={t("menuLanguage")}>
                <Segmented
                  options={languages}
                  selected={language}
                  onSelect={setLanguage}
                />
              </MenuGroup>

              <MenuGroup label={t("menuSound")}>
                <Segmented
                  options={[
                    { value: false, label: t("menuSoundOn") },
                    { value: true, label: t("menuSoundOff") },
                  ]}
                  selected={muted}
                  onSelect={(next) => {
                    setMuted(next);
                    // Silenciar calla también lo que se esté diciendo.
                    if (next) cancelSpeech();
                  }}
                />
              </MenuGroup>

              <MenuGroup label={t("menuText")}>
                <Segmented
                  options={textSizes}
                  selected={textSize}
                  onSelect={setTextSize}
                />
              </MenuGroup>

              <div className="mt-3 border-t border-ink/10 pt-3">
                <button
                  type="button"
                  onClick={() => setAboutOpen((current) => !current)}
                  aria-expanded={aboutOpen}
                  className="flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl px-2 text-left text-base font-extrabold text-ink transition-colors active:bg-sunsoft"
                >
                  {t("menuAbout")}
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-sm text-ink/45 transition-transform ${
                      aboutOpen ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                </button>

                {aboutOpen && (
                  <div className="mt-1 rounded-2xl bg-white px-3 py-3 text-left">
                    <p className="text-base font-extrabold text-ink">
                      B<span className="text-sun">Intuitive</span>
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-ink/60">
                      {t("aboutTagline")}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-snug text-ink/55">
                      {t("aboutDescription")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function MenuGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const labelId = useId();

  return (
    <div className="mb-3 last:mb-0">
      <p
        id={labelId}
        className="px-2 pb-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-ink/45"
      >
        {label}
      </p>
      <div role="group" aria-labelledby={labelId} className="flex gap-1.5">
        {children}
      </div>
    </div>
  );
}

/**
 * Grupo de opciones excluyentes.
 *
 * Son botones normales con `aria-pressed`, no un `radiogroup`: un grupo de
 * radios promete navegación con flechas y un único punto de tabulación, y
 * anunciarlo sin implementarlo confunde más que ayudar. Así cada opción se
 * alcanza con Tab y se activa con Enter o espacio, que es lo que un botón hace
 * de por sí, y el estado elegido se anuncia igual.
 */
function Segmented<T extends string | boolean>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(option.value)}
            /*
              `min-w-0` para que la opción pueda encoger por debajo de su
              texto: sin él, "Desactivado" o "Muy grande" con la letra en
              grande empujaban el panel. Envuelven y el botón crece a lo alto.
            */
            className={`min-h-12 min-w-0 flex-1 break-words rounded-2xl border-2 px-1.5 py-1 text-sm font-extrabold leading-snug transition-colors sm:px-2 ${
              isSelected
                ? "border-sun bg-sun text-black"
                : "border-ink/12 bg-white text-ink/60 active:bg-sunsoft"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </>
  );
}

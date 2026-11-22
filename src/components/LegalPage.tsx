"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "./BrandMark";
import LanguageSwitch from "./LanguageSwitch";
import { LEGAL_UPDATED, type LegalDocument } from "@/data/legal";
import { useDocumentTitle } from "@/lib/documentTitle";
import { useLanguage } from "@/lib/i18n";
import type { Language } from "@/lib/language";
import { LANDING } from "@/lib/routes";

/**
 * Una página legal: privacidad o términos, en el idioma elegido.
 *
 * Es pública y sin marco de aplicación, como la portada: la enlazan la
 * portada, el registro, Perfil y las fichas de las tiendas, así que tiene que
 * leerse igual entrando desde cualquiera. Volver lleva a donde se venía y, si
 * se llegó directamente por el enlace, a la portada.
 */
export default function LegalPage({
  documents,
}: {
  documents: Record<Language, LegalDocument>;
}) {
  const { language, t } = useLanguage();
  const router = useRouter();
  const legal = documents[language];
  useDocumentTitle(legal.title);

  const updated = new Date(`${LEGAL_UPDATED}T12:00:00`).toLocaleDateString(
    language === "es" ? "es-CO" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  // `/privacy#delete` es la dirección que se da a Google Play para explicar
  // cómo borrar la cuenta. El navegador busca el ancla al cargar, antes de que
  // el idioma elegido vuelva a pintar la página, así que se busca otra vez
  // cuando ya está el texto definitivo.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) window.document.getElementById(hash)?.scrollIntoView();
  }, [language]);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(LANDING);
  };

  return (
    <main className="landing-surface min-h-[100svh] px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            className="flex min-h-12 items-center gap-2 rounded-full border-2 border-ink/15 bg-white px-4 text-base font-extrabold text-ink shadow-sm transition-transform active:scale-95"
          >
            <span aria-hidden="true">←</span>
            {t("back")}
          </button>
          <LanguageSwitch />
        </div>

        <article className="mt-6 rounded-3xl border border-ink/10 bg-white p-5 shadow-sm sm:p-8">
          <BrandMark size={56} />
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{legal.title}</h1>
          <p className="mt-1 text-sm font-bold text-ink/70">{t("legalUpdated", { date: updated })}</p>
          <p className="mt-4 text-base font-semibold leading-relaxed text-ink/80">{legal.intro}</p>

          {legal.sections.map((section) => (
            <section key={section.heading} id={section.id} className="mt-6 scroll-mt-6">
              <h2 className="text-xl font-extrabold leading-snug">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-base leading-relaxed text-ink/80">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-2 list-disc space-y-1 pl-6 text-base leading-relaxed text-ink/80">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}

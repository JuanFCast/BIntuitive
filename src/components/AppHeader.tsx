"use client";

import Link from "next/link";
import AppMenu from "./AppMenu";
import BrandMark from "./BrandMark";
import { useLanguage } from "@/lib/i18n";
import { EXPLORE } from "@/lib/routes";

export default function AppHeader() {
  const { t } = useLanguage();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Dentro de la aplicación, volver al principio es volver al panal, no
            a la raíz: la raíz es ahora la portada pública. */}
        <Link
          href={EXPLORE}
          className="app-header-logo"
          aria-label={t("navHome")}
        >
          <BrandMark size={42} priority />
        </Link>

        <Link
          href={EXPLORE}
          className="app-header-brand"
          aria-label="BIntuitive"
        >
          <span>B</span>
          <span className="text-sun">Intuitive</span>
        </Link>

        <AppMenu />
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import AppMenu from "./AppMenu";
import BrandMark from "./BrandMark";
import { useLanguage } from "@/lib/i18n";

export default function AppHeader() {
  const { t } = useLanguage();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Volver al principio es volver a Explore: no hay pantalla de inicio. */}
        <Link
          href="/hexagons"
          className="app-header-logo"
          aria-label={t("navExplore")}
        >
          <BrandMark size={42} priority />
        </Link>

        <Link
          href="/hexagons"
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

"use client";

import Link from "next/link";
import BrandMark from "./BrandMark";
import { useLanguage } from "@/lib/i18n";

export default function AppHeader() {
  const { t } = useLanguage();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link
          href="/"
          className="app-header-logo"
          aria-label={t("navHome")}
        >
          <BrandMark size={42} priority />
        </Link>

        <Link href="/" className="app-header-brand" aria-label="BIntuitive">
          <span>B</span>
          <span className="text-sun">Intuitive</span>
        </Link>

        <span className="h-11 w-11" aria-hidden="true" />
      </div>
    </header>
  );
}

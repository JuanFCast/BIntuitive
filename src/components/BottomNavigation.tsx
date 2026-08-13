"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

type IconProps = {
  active: boolean;
};

const navItems = [
  { href: "/", labelKey: "navHome", icon: HomeIcon },
  { href: "/hexagons", labelKey: "navExplore", icon: ExploreIcon },
  { href: "/games", labelKey: "navGames", icon: GamesIcon },
  { href: "/progress", labelKey: "navProgress", icon: ProgressIcon },
  { href: "/profile", labelKey: "navProfile", icon: ProfileIcon },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="bottom-navigation" aria-label={t("navAria")}>
      <div className="bottom-navigation-inner">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-label={t(item.labelKey)}
              aria-current={active ? "page" : undefined}
              className={`bottom-navigation-item ${active ? "is-active" : ""}`}
            >
              <span className="bottom-navigation-icon" aria-hidden="true">
                <Icon active={active} />
              </span>
              <span className="bottom-navigation-label">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path
        d="M3.5 10.5 12 3l8.5 7.5v8.25A2.25 2.25 0 0 1 18.25 21H5.75a2.25 2.25 0 0 1-2.25-2.25V10.5Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 21v-6.25h5.5V21"
        fill={active ? "var(--color-sunsoft)" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExploreIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path
        d="m8.2 3.25 3.25 1.88v3.74L8.2 10.75 4.95 8.87V5.13L8.2 3.25Zm7.6 10 3.25 1.88v3.74l-3.25 1.88-3.25-1.88v-3.74l3.25-1.88ZM8.2 13.25l3.25 1.88v3.74L8.2 20.75l-3.25-1.88v-3.74l3.25-1.88Zm7.6-10 3.25 1.88v3.74l-3.25 1.88-3.25-1.88V5.13l3.25-1.88Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GamesIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path
        d="M7.2 7.25h9.6a4.4 4.4 0 0 1 4.2 5.73l-1.38 4.34a2.25 2.25 0 0 1-3.72.93l-1.35-1.25h-5.1L8.1 18.25a2.25 2.25 0 0 1-3.72-.93L3 12.98a4.4 4.4 0 0 1 4.2-5.73Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
      <path
        d="M7.25 10v4M5.25 12h4M15.5 11h.01M18 13h.01"
        fill="none"
        stroke={active ? "var(--color-sunsoft)" : "currentColor"}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProgressIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path
        d="M8 4h8v3.25A4 4 0 0 1 12 11a4 4 0 0 1-4-3.75V4Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinejoin="round"
      />
      <path
        d="M8 6H4.5v1.25A3.75 3.75 0 0 0 8.25 11M16 6h3.5v1.25A3.75 3.75 0 0 1 15.75 11M12 11v4m-3.5 5h7M9 15h6v5H9z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <circle
        cx="12"
        cy="8"
        r="4"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M4.5 21a7.5 7.5 0 0 1 15 0H4.5Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

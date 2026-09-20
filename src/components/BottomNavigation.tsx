"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HEXAGON_WIDTH_RATIO, hexagonPoints } from "@/lib/hexagon";
import { useLanguage } from "@/lib/i18n";
import { EXPLORE, LEGACY_EXPLORE } from "@/lib/routes";

type IconProps = {
  active: boolean;
};

// Explore, Progress y Profile: los tres únicos destinos de la barra. Explore
// es el panal, que desde que la raíz es la portada pública vive en `/explore`.
//
// `legacyHref` es una dirección anterior del panal, que sigue sirviendo la
// misma pantalla mientras dure el redirect antiguo en las cachés (ver
// `src/lib/routes.ts`). Quien entre por ahí tiene que ver su pestaña encendida.
const navItems = [
  {
    href: EXPLORE,
    legacyHref: LEGACY_EXPLORE,
    labelKey: "navHome",
    icon: HomeIcon,
  },
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
          const active =
            pathname === item.href ||
            ("legacyHref" in item && pathname === item.legacyHref);
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

/*
 * La casa del panal: un tejado sobre cuatro celdas de dos en dos.
 *
 * No es la casita genérica de cualquier aplicación ni el panal a secas: las
 * celdas son las fichas de la pantalla —el mismo hexagono pointy-top, con su
 * fila de abajo corrida media ficha— y el tejado dice que aquí se entra. Se
 * dibujan al 80% de su celda para que el hueco entre vecinas sobreviva al
 * relleno del estado activo, que es cuando dos siluetas pegadas se leerían
 * como una mancha.
 */
const HOME_HEX_RADIUS = 3.7;
const HOME_HEX_WIDTH = HOME_HEX_RADIUS * HEXAGON_WIDTH_RATIO;
const HOME_HEX_LEFT = (24 - 2.5 * HOME_HEX_WIDTH) / 2 + HOME_HEX_WIDTH / 2;
// La primera fila empieza dos unidades por debajo del alero: el hueco tiene
// que sobrevivir a los dos trazos que lo muerden cuando la pestaña se enciende.
const HOME_HEX_FIRST_ROW = 10 + HOME_HEX_RADIUS;

const HOME_HEXAGONS = [0, 1].flatMap((row) =>
  [0, 1].map((column) => ({
    cx: HOME_HEX_LEFT + row * (HOME_HEX_WIDTH / 2) + column * HOME_HEX_WIDTH,
    cy: HOME_HEX_FIRST_ROW + row * HOME_HEX_RADIUS * 1.5,
  })),
);

function HomeIcon({ active }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      {/* El tejado, un poco mas ancho que el panal que cubre. */}
      <polygon
        points="12,2.6 21,8 3,8"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/*
        Encendidas, las celdas van rellenas y SIN trazo: el contorno crece
        hacia fuera y se comeria el hueco que las separa, y cuatro hexagonos
        pegados dejan de leerse como panal para leerse como mancha.
      */}
      {HOME_HEXAGONS.map(({ cx, cy }) => (
        <polygon
          key={`${cx}-${cy}`}
          points={hexagonPoints(cx, cy, HOME_HEX_RADIUS * 0.78)}
          fill={active ? "currentColor" : "none"}
          stroke={active ? "none" : "currentColor"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      ))}
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

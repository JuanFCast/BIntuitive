import Link from "next/link";
import type { Hexagon } from "@/data/categories";
import { localizeHexagon } from "@/data/localization";
import type { Language } from "@/lib/language";

const HEXAGON_CLIP =
  "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

type HexagonCardProps = {
  hexagon: Hexagon;
  language: Language;
};

export default function HexagonCard({
  hexagon,
  language,
}: HexagonCardProps) {
  const localizedHexagon = localizeHexagon(hexagon, language);
  const href =
    "href" in hexagon ? hexagon.href : `/game?hexagon=${hexagon.slug}`;

  return (
    <Link
      href={href}
      className="hexagon-card group relative aspect-[1.1] w-[calc(50%_-_0.375rem)] max-w-[19rem] drop-shadow-[0_10px_0_rgba(255,196,0,0.28)] transition-transform active:translate-y-1 active:scale-[0.98] sm:w-[calc(33.333%_-_1rem)]"
      style={{ clipPath: HEXAGON_CLIP }}
      aria-label={
        language === "en"
          ? `Open the ${localizedHexagon.name} hexagon`
          : `Abrir el hexágono ${localizedHexagon.name}`
      }
    >
      <span
        className="absolute inset-0 flex flex-col items-center justify-center bg-sun px-3 text-center text-black sm:px-5"
        style={{ clipPath: HEXAGON_CLIP }}
      >
        <span className="hexagon-emoji text-[clamp(2.5rem,12vw,5.25rem)] leading-none" aria-hidden="true">
          {localizedHexagon.emoji}
        </span>
        <span className="hexagon-name mt-1 text-lg font-extrabold leading-tight sm:text-2xl">
          {localizedHexagon.name}
        </span>
      </span>
    </Link>
  );
}

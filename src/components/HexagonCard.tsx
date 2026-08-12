import Link from "next/link";
import type { Hexagon } from "@/data/categories";
import { localizeHexagon } from "@/data/localization";
import type { Language } from "@/lib/language";

const HEXAGON_CLIP =
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

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
      className="hexagon-card group absolute bg-cream transition-[filter,transform] duration-200 hover:z-10 hover:brightness-[1.04] focus-visible:z-10 focus-visible:brightness-[1.04] focus-visible:outline-none active:scale-[0.98]"
      style={{ clipPath: HEXAGON_CLIP }}
      aria-label={
        language === "en"
          ? `Open the ${localizedHexagon.name} hexagon`
          : `Abrir el hexágono ${localizedHexagon.name}`
      }
    >
      <span
        className="absolute inset-px flex flex-col items-center justify-center bg-sun px-2 text-center text-ink transition-colors group-hover:bg-[#ffd229] group-focus-visible:bg-[#ffd229] sm:px-4"
        style={{ clipPath: HEXAGON_CLIP }}
      >
        <span className="hexagon-emoji text-[clamp(2rem,9vw,4rem)] leading-none" aria-hidden="true">
          {localizedHexagon.emoji}
        </span>
        <span className="hexagon-name mt-1 max-w-[86%] text-[clamp(0.85rem,3.8vw,1.35rem)] font-extrabold leading-[1.05]">
          {localizedHexagon.name}
        </span>
      </span>
    </Link>
  );
}

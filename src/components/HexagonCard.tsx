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
      className="hexagon-card group absolute aspect-[1.1547] w-2/5 bg-cream transition-[filter,transform] duration-200 hover:z-10 hover:brightness-[1.04] focus-visible:z-10 focus-visible:brightness-[1.04] focus-visible:outline-none active:scale-[0.98]"
      style={{ clipPath: HEXAGON_CLIP }}
      aria-label={
        language === "en"
          ? `Open the ${localizedHexagon.name} hexagon`
          : `Abrir el hexágono ${localizedHexagon.name}`
      }
    >
      <span
        className="absolute inset-[1.5px] flex flex-col items-center justify-center bg-sun px-2 text-center text-ink transition-colors group-hover:bg-[#ffd229] group-focus-visible:bg-[#ffd229] sm:px-5"
        style={{ clipPath: HEXAGON_CLIP }}
      >
        <span className="hexagon-emoji text-[clamp(2.15rem,10vw,4.75rem)] leading-none" aria-hidden="true">
          {localizedHexagon.emoji}
        </span>
        <span className="hexagon-name mt-1 text-[clamp(0.9rem,4.15vw,1.55rem)] font-extrabold leading-[1.05]">
          {localizedHexagon.name}
        </span>
      </span>
    </Link>
  );
}

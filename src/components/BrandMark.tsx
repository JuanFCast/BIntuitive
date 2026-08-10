import Image from "next/image";

type BrandMarkProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export default function BrandMark({
  size = 96,
  className = "",
  priority = false,
}: BrandMarkProps) {
  return (
    <Image
      src="/brand-mark.png"
      alt="BeeSmart"
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 rounded-[22%] ${className}`}
    />
  );
}

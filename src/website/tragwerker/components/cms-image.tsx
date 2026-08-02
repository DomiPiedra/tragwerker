import Image from "next/image";

type CmsImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
};

export function CmsImage({
  src,
  alt,
  className,
  priority,
  sizes = "100vw",
  fill,
  width,
  height,
}: CmsImageProps) {
  if (!src) {
    return (
      <div
        className={`absolute inset-0 bg-[var(--site-line)] ${className ?? ""}`}
        aria-label={alt}
        role="img"
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1600}
      height={height ?? 1000}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}

import { CmsImage } from "@/website/tragwerker/components/cms-image";

type TeamMemberCardProps = {
  name: string;
  role: string;
  avatarUrl: string | null;
};

export function TeamMemberCard({ name, role, avatarUrl }: TeamMemberCardProps) {
  return (
    <article>
      <div className="site-media-frame relative aspect-[2/1] overflow-hidden bg-[var(--site-line)]">
        <CmsImage
          src={avatarUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover object-center"
        />
      </div>
      <p className="mt-5 font-site-serif text-xl tracking-tight">{name}</p>
      <p className="mt-1 min-h-[2.5em] whitespace-pre-line text-xs uppercase leading-snug tracking-[0.18em] text-[var(--site-muted)] line-clamp-2">
        {role}
      </p>
    </article>
  );
}

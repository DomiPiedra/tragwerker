import { CmsImage } from "@/website/tragwerker/components/cms-image";

type TeamMemberCardProps = {
  name: string;
  role: string;
  avatarUrl: string | null;
  bio?: string | null;
  expertise?: string[];
  size?: "leadership" | "default";
};

export function TeamMemberCard({
  name,
  role,
  avatarUrl,
  bio,
  expertise = [],
  size = "default",
}: TeamMemberCardProps) {
  const isLeadership = size === "leadership";

  return (
    <article>
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--site-line)]">
        <CmsImage
          src={avatarUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <p
        className={
          isLeadership
            ? "mt-5 font-site-serif text-2xl tracking-tight"
            : "mt-5 font-site-serif text-xl tracking-tight"
        }
      >
        {name}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--site-muted)]">{role}</p>
      {isLeadership && bio ? (
        <p className="mt-4 text-sm leading-relaxed text-[var(--site-muted)]">{bio}</p>
      ) : null}
      {!isLeadership && expertise.length > 0 ? (
        <p className="mt-3 text-sm text-[var(--site-muted)]">{expertise.join(" · ")}</p>
      ) : null}
    </article>
  );
}

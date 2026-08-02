import { HomeProjectCard } from "@/website/tragwerker/components/home/site-home-project-card";
import type { ProjectBrowserItem } from "@/website/tragwerker/components/project-list-card";

type SiteHomeProjectsProps = {
  projects: ProjectBrowserItem[];
};

export function SiteHomeProjects({ projects }: SiteHomeProjectsProps) {
  if (projects.length === 0) return null;

  const [first, second, third] = projects;

  return (
    <section className="site-container py-16 md:py-24 lg:py-28">
      <div className="grid gap-x-8 gap-y-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-14">
        {first ? (
          <div className="lg:col-span-7 lg:row-start-1">
            <HomeProjectCard layout="wide" {...first} />
          </div>
        ) : null}
        {second ? (
          <div className="lg:col-span-5 lg:row-start-1">
            <HomeProjectCard layout="portrait" {...second} />
          </div>
        ) : null}
        {third ? (
          <div className="lg:col-span-5 lg:row-start-2">
            <HomeProjectCard layout="medium" {...third} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

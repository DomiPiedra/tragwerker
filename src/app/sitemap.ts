import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/website/tragwerker/config";
import { getPublishedJobs, getPublishedProjects } from "@/website/tragwerker/queries";

const STATIC_PATHS = [
  "/",
  "/menschen",
  "/kompetenzen",
  "/projekte",
  "/tragwerksplanung",
  "/pruefung",
  "/kontakt",
  "/jobs",
  "/impressum",
  "/datenschutz",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, jobs] = await Promise.all([getPublishedProjects(), getPublishedJobs()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const projectEntries: MetadataRoute.Sitemap = projects.map((project) => ({
    url: absoluteUrl(`/projekte/${project.slug}`),
    lastModified: project.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: absoluteUrl(`/jobs/${job.slug}`),
    lastModified: job.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...projectEntries, ...jobEntries];
}

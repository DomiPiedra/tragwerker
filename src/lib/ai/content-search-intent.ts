import { z } from "zod";

import { generateObjectWithFallback } from "@/lib/ai/run-with-fallback";

export type ContentSection =
  | "blog"
  | "projects"
  | "portfolio"
  | "team"
  | "events"
  | "properties"
  | "jobs";

const intentSchema = z.object({
  goal: z.enum(["list_recent", "open_section", "search_specific", "none"]),
  section: z
    .enum(["blog", "projects", "portfolio", "team", "events", "properties", "jobs"])
    .nullable(),
  limit: z.number().min(1).max(24).optional(),
});

const DEFAULT_LIMIT = 8;

/**
 * When keyword / regex parsing finds no DB rows, infer whether the user wants
 * a recent-items listing for a CMS section (blog, projects, …).
 */
export async function inferRecentListingIntent(
  query: string
): Promise<{ section: ContentSection; limit: number } | null> {
  const trimmed = query.trim();
  if (trimmed.length < 8) return null;

  const object = await generateObjectWithFallback({
    tier: "fast",
    schema: intentSchema,
    temperature: 0.05,
    system: [
      "You classify short natural-language queries for a CMS dashboard search bar.",
      "Sections: blog (posts/articles), projects, portfolio, team (people), events, properties (immobilien/real estate), jobs (careers/hiring/openings).",
      "goal=list_recent: user wants newest/recent/latest items listed (with or without an explicit count).",
      "goal=open_section: they only want to open the section index, not specific recent rows.",
      "goal=search_specific: they are looking for one record by name/topic — not a generic recent list.",
      "goal=none: unrelated or unclear.",
      "If goal=list_recent and section is known, set section. Pick limit only when they state a number (else omit).",
    ].join(" "),
    prompt: `Query: "${trimmed}"`,
  });

  if (!object || object.goal !== "list_recent" || !object.section) return null;
  const limit = Math.min(Math.max(object.limit ?? DEFAULT_LIMIT, 1), 24);
  return { section: object.section, limit };
}

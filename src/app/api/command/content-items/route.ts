import { NextResponse } from "next/server";

import { inferRecentListingIntent } from "@/lib/ai/content-search-intent";
import { stripCommandIntentPrefixes } from "@/lib/commands/intent-strip";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LIMIT_PER_LIST = 6;
const MAX_TOTAL_RESULTS = 24;
const DEFAULT_RECENT_LIMIT = 8;

type ContentItemSuggestion = {
  id: string;
  title: string;
  description: string;
  path: string;
  list: string;
  keywords: string[];
  priority: number;
};

type ContentType =
  | "projects"
  | "portfolio"
  | "team"
  | "events"
  | "blog"
  | "properties"
  | "jobs";

function buildTextSearchQuery(query: string) {
  return {
    contains: query,
    mode: "insensitive" as const,
  };
}

function mapLatestSubjectToType(subjectRaw: string): ContentType | null {
  const subject = subjectRaw.toLowerCase().trim();
  if (!subject) return null;
  if (/(immobilien|real\s+estate|(^|\s)properties(\s|$))/.test(subject)) return "properties";
  if (/\bportfolio\b|case\s+stud/.test(subject)) return "portfolio";
  if (/\bprojects?\b/.test(subject)) return "projects";
  if (/\bevents?\b|calendar/.test(subject)) return "events";
  if (/\bteam\b|members?|people|staff/.test(subject)) return "team";
  if (/\bblog\b|\bposts?\b|\barticles?\b/.test(subject)) return "blog";
  if (/\bjobs?\b|careers?|hiring|openings?|positions?/.test(subject)) return "jobs";
  return null;
}

function parseLatestRequest(query: string): { type: ContentType; limit: number } | null {
  const normalized = query.toLowerCase().trim();

  const numbered = normalized.match(
    /(?:show|list|get)?\s*(?:me\s*)?(?:the\s*)?(?:last|latest|recent|newest)\s+(\d+)\s+(.+)/i
  );
  if (numbered) {
    const rawLimit = Number.parseInt(numbered[1] ?? "0", 10);
    const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? 0 : rawLimit, 1), 24);
    if (limit <= 0) return null;
    const mapped = mapLatestSubjectToType(numbered[2] ?? "");
    return mapped ? { type: mapped, limit } : null;
  }

  const implicit = normalized.match(
    /(?:show|list|get)?\s*(?:me\s*)?(?:the\s*)?(?:last|latest|recent|newest)\s+(.+)/i
  );
  if (!implicit) return null;
  const mapped = mapLatestSubjectToType(implicit[1] ?? "");
  return mapped ? { type: mapped, limit: DEFAULT_RECENT_LIMIT } : null;
}

async function fetchLatestItems(type: ContentType, limit: number): Promise<ContentItemSuggestion[]> {
  switch (type) {
    case "blog": {
      const rows = await prisma.blogPost.findMany({
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((item) => ({
        id: `content-blog-${item.id}`,
        title: item.title,
        description: `Blog · ${item.published ? "Published" : "Draft"}`,
        path: `/blog?postId=${encodeURIComponent(item.id)}&blogView=full`,
        list: "Blog",
        keywords: ["blog", item.slug, item.excerpt ?? "", item.published ? "published" : "draft"],
        priority: 95,
      }));
    }
    case "projects": {
      const rows = await prisma.project.findMany({
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((item) => ({
        id: `content-project-${item.id}`,
        title: item.name,
        description: `Project · ${item.author} · ${item.category}`,
        path: `/projects?projectId=${encodeURIComponent(item.id)}&projectView=full`,
        list: "Projects",
        keywords: ["project", item.slug, item.author, item.category, item.status],
        priority: 98,
      }));
    }
    case "portfolio": {
      const rows = await prisma.portfolioItem.findMany({
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((item) => ({
        id: `content-portfolio-${item.id}`,
        title: item.title,
        description: `Portfolio · ${item.status}`,
        path: `/portfolio?itemId=${encodeURIComponent(item.id)}&portfolioView=full`,
        list: "Portfolio",
        keywords: ["portfolio", item.slug, item.status, item.summary ?? ""],
        priority: 97,
      }));
    }
    case "team": {
      const rows = await prisma.teamMember.findMany({
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((item) => ({
        id: `content-team-${item.id}`,
        title: item.name,
        description: `Team · ${item.role}`,
        path: `/team?memberId=${encodeURIComponent(item.id)}&teamView=full`,
        list: "Team",
        keywords: ["team", item.role, item.bio ?? ""],
        priority: 96,
      }));
    }
    case "events": {
      const rows = await prisma.event.findMany({
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((item) => ({
        id: `content-event-${item.id}`,
        title: item.title,
        description: `Event · ${item.location ?? "No location"}`,
        path: `/events?eventId=${encodeURIComponent(item.id)}&eventView=full`,
        list: "Events",
        keywords: ["event", item.slug, item.location ?? "", item.description ?? ""],
        priority: 95,
      }));
    }
    case "jobs": {
      const rows = await prisma.job.findMany({
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((item) => ({
        id: `content-job-${item.id}`,
        title: item.title,
        description: `Job · ${item.department ?? "General"} · ${item.location ?? "Remote"}`,
        path: `/jobs?jobId=${encodeURIComponent(item.id)}&jobView=full`,
        list: "Jobs",
        keywords: [
          "job",
          "career",
          item.slug,
          item.department ?? "",
          item.location ?? "",
          item.published ? "published" : "draft",
        ],
        priority: 94,
      }));
    }
    default: {
      const rows = await prisma.property.findMany({
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
      return rows.map((item) => ({
        id: `content-property-${item.id}`,
        title: item.title,
        description: `Immobilien · ${item.status}`,
        path: `/immobilien?propertyId=${encodeURIComponent(item.id)}&propertyView=full`,
        list: "Immobilien",
        keywords: ["property", "immobilien", item.slug, item.status, item.address ?? ""],
        priority: 94,
      }));
    }
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [] as ContentItemSuggestion[] }, { status: 401 });
  }
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2) {
    return NextResponse.json({ items: [] as ContentItemSuggestion[] });
  }

  const latestRequest = parseLatestRequest(query);
  if (latestRequest) {
    const items = await fetchLatestItems(latestRequest.type, latestRequest.limit);
    return NextResponse.json({ items });
  }

  const stripped = stripCommandIntentPrefixes(query);
  const effectiveSearch = stripped.length >= 2 ? stripped : query;
  const search = buildTextSearchQuery(effectiveSearch);

  let blogPosts = await prisma.blogPost.findMany({
    where: {
      OR: [{ title: search }, { slug: search }, { excerpt: search }, { content: search }],
    },
    take: LIMIT_PER_LIST,
    orderBy: { updatedAt: "desc" },
  });

  const tokens = effectiveSearch
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2)
    .slice(0, 6);
  if (blogPosts.length === 0 && tokens.length >= 2) {
    blogPosts = await prisma.blogPost.findMany({
      where: {
        AND: tokens.map((term) => ({
          OR: [
            { title: buildTextSearchQuery(term) },
            { slug: buildTextSearchQuery(term) },
            { excerpt: buildTextSearchQuery(term) },
          ],
        })),
      },
      take: LIMIT_PER_LIST,
      orderBy: { updatedAt: "desc" },
    });
  }

  const [projects, portfolioItems, teamMembers, events, jobs, properties] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [{ name: search }, { slug: search }, { author: search }, { category: search }],
      },
      take: LIMIT_PER_LIST,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.portfolioItem.findMany({
      where: {
        OR: [{ title: search }, { slug: search }, { summary: search }],
      },
      take: LIMIT_PER_LIST,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.teamMember.findMany({
      where: {
        OR: [{ name: search }, { role: search }, { bio: search }],
      },
      take: LIMIT_PER_LIST,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.event.findMany({
      where: {
        OR: [{ title: search }, { slug: search }, { location: search }, { description: search }],
      },
      take: LIMIT_PER_LIST,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.job.findMany({
      where: {
        OR: [
          { title: search },
          { slug: search },
          { position: search },
          { department: search },
          { location: search },
          { shortDescription: search },
        ],
      },
      take: LIMIT_PER_LIST,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.property.findMany({
      where: {
        OR: [{ title: search }, { slug: search }, { address: search }, { status: search }],
      },
      take: LIMIT_PER_LIST,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const items: ContentItemSuggestion[] = [
    ...projects.map((item) => ({
      id: `content-project-${item.id}`,
      title: item.name,
      description: `Project · ${item.author} · ${item.category}`,
      path: `/projects?projectId=${encodeURIComponent(item.id)}&projectView=full`,
      list: "Projects",
      keywords: ["project", item.slug, item.author, item.category, item.status],
      priority: 98,
    })),
    ...portfolioItems.map((item) => ({
      id: `content-portfolio-${item.id}`,
      title: item.title,
      description: `Portfolio · ${item.status}`,
      path: `/portfolio?itemId=${encodeURIComponent(item.id)}&portfolioView=full`,
      list: "Portfolio",
      keywords: ["portfolio", item.slug, item.status, item.summary ?? ""],
      priority: 97,
    })),
    ...teamMembers.map((item) => ({
      id: `content-team-${item.id}`,
      title: item.name,
      description: `Team · ${item.role}`,
      path: `/team?memberId=${encodeURIComponent(item.id)}&teamView=full`,
      list: "Team",
      keywords: ["team", item.role, item.bio ?? ""],
      priority: 96,
    })),
    ...events.map((item) => ({
      id: `content-event-${item.id}`,
      title: item.title,
      description: `Event · ${item.location ?? "No location"}`,
      path: `/events?eventId=${encodeURIComponent(item.id)}&eventView=full`,
      list: "Events",
      keywords: ["event", item.slug, item.location ?? "", item.description ?? ""],
      priority: 95,
    })),
    ...blogPosts.map((item) => ({
      id: `content-blog-${item.id}`,
      title: item.title,
      description: `Blog · ${item.published ? "Published" : "Draft"}`,
      path: `/blog?postId=${encodeURIComponent(item.id)}&blogView=full`,
      list: "Blog",
      keywords: ["blog", item.slug, item.excerpt ?? "", item.published ? "published" : "draft"],
      priority: 95,
    })),
    ...jobs.map((item) => ({
      id: `content-job-${item.id}`,
      title: item.title,
      description: `Job · ${item.department ?? "General"} · ${item.location ?? "Remote"}`,
      path: `/jobs?jobId=${encodeURIComponent(item.id)}&jobView=full`,
      list: "Jobs",
      keywords: [
        "job",
        "career",
        item.slug,
        item.department ?? "",
        item.location ?? "",
        item.published ? "published" : "draft",
      ],
      priority: 94,
    })),
    ...properties.map((item) => ({
      id: `content-property-${item.id}`,
      title: item.title,
      description: `Immobilien · ${item.status}`,
      path: `/immobilien?propertyId=${encodeURIComponent(item.id)}&propertyView=full`,
      list: "Immobilien",
      keywords: ["property", "immobilien", item.slug, item.status, item.address ?? ""],
      priority: 94,
    })),
  ];

  const trimmed = query.trim();
  if (items.length === 0 && trimmed.length >= 10) {
    const inferred = await inferRecentListingIntent(trimmed);
    if (inferred) {
      const recentItems = await fetchLatestItems(inferred.section, inferred.limit);
      return NextResponse.json({ items: recentItems });
    }
  }

  return NextResponse.json({
    items: items.slice(0, MAX_TOTAL_RESULTS),
  });
}

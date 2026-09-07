/**
 * Import Tragwerker referenzen into CMS Project collection.
 * Run: DATABASE_URL=... npx tsx scripts/import-referenzen.ts
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "../src/lib/prisma";

const BASE = "https://tragwerker.de";
const OUT_DIR = path.join(process.cwd(), "public/uploads/media");

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function stripTags(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategory(cat: string) {
  const c = cat.trim();
  if (/pflege/i.test(c) || /krankenhaus/i.test(c)) return "Krankenhäuser und Pflege";
  if (/schule|kita|kindergarten|kinderkr/i.test(c)) return "Schulen und Kindergärten";
  return c;
}

function guessLocation(title: string) {
  const known = [
    "Germering",
    "Eichenau",
    "Puchheim",
    "München",
    "Munchen",
    "Erding",
    "Ebersberg",
    "Herrsching",
    "Fürstenfeldbruck",
    "Furstenfeldbruck",
    "FFB",
    "Landsberg",
    "Mammendorf",
    "Jesenwang",
    "Grafrath",
    "Unterpfaffenhofen",
  ];
  for (const place of known) {
    if (title.toLowerCase().includes(place.toLowerCase())) {
      if (place === "Munchen") return "München";
      if (place === "Furstenfeldbruck" || place === "FFB") return "Fürstenfeldbruck";
      return place;
    }
  }
  return null;
}

function fallbackDescription(title: string, category: string, location: string | null) {
  const where = location ? ` in ${location}` : "";
  const cat = category.toLowerCase();
  if (cat.includes("prüfung")) {
    return `Für das Projekt „${title}“${where} übernahmen wir die prüfende Begleitung der Tragwerksplanung. Im Fokus standen Tragsicherheit, Wirtschaftlichkeit und die Abstimmung mit den beteiligten Planungs- und Ausführungspartnern.`;
  }
  if (cat.includes("schule") || cat.includes("kita") || cat.includes("kindergarten")) {
    return `Beim Vorhaben „${title}“${where} entwickelten wir das Tragwerk für einen Bildungs- bzw. Betreuungbau. Die Planung berücksichtigt hohe Nutzungsanforderungen, flexible Raumstrukturen und eine wirtschaftliche, dauerhafte Konstruktion.`;
  }
  if (cat.includes("wohn")) {
    return `Für „${title}“${where} erarbeiteten wir die Tragwerksplanung eines Wohnungsbauvorhabens. Ziel war ein effizientes, materialgerechtes Tragwerk, das Architektur, Bauablauf und langfristige Gebrauchstauglichkeit in Einklang bringt.`;
  }
  if (cat.includes("krankenhaus") || cat.includes("pflege") || cat.includes("senior")) {
    return `Im Projekt „${title}“${where} planten wir das Tragwerk für einen Bau im Gesundheits- bzw. Pflegebereich. Besondere Aufmerksamkeit galt Standsicherheit, Installationsführung und der Abstimmung mit den hohen funktionalen Anforderungen.`;
  }
  if (cat.includes("büro") || cat.includes("gewerbe")) {
    return `Für „${title}“${where} entwickelten wir die Tragwerksplanung eines gewerblichen bzw. administrativen Bauwerks. Die Konstruktion verbindet Spannweiten, Wirtschaftlichkeit und eine klare konstruktive Logik.`;
  }
  return `Beim Projekt „${title}“${where} (${category}) begleiteten wir die Tragwerksplanung von der Konzeption bis zur Ausführung. Funktionalität, Tragsicherheit, Dauerhaftigkeit und gestalterische Anforderungen wurden dabei ganzheitlich berücksichtigt.`;
}

async function downloadImage(remotePath: string): Promise<string | null> {
  const encoded = remotePath.startsWith("http")
    ? remotePath
    : `${BASE}/${remotePath
        .split("/")
        .map((seg) => encodeURIComponent(seg))
        .join("/")}`;

  try {
    const res = await fetch(encoded);
    if (!res.ok) {
      console.warn(`  image fail ${res.status}: ${encoded}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const lower = encoded.toLowerCase();
    const ext = lower.includes(".png") ? "png" : lower.includes(".jpeg") ? "jpeg" : "jpg";
    const hash = createHash("md5").update(buf).digest("hex").slice(0, 8);
    const base = slugify(path.basename(remotePath, path.extname(remotePath))) || "ref";
    const filename = `${base}-${hash}.${ext}`;
    await writeFile(path.join(OUT_DIR, filename), buf);
    return `/uploads/media/${filename}`;
  } catch (error) {
    console.warn(`  image error: ${encoded}`, error);
    return null;
  }
}

type ListingItem = {
  href: string;
  title: string;
  category: string;
  image: string;
};

async function fetchListing(): Promise<ListingItem[]> {
  const res = await fetch(`${BASE}/referenzen-1706.html`);
  const html = await res.text();
  const chunks = html.split(/<div class="item block[^"]*">/).slice(1);
  const items: ListingItem[] = [];
  for (const ch of chunks) {
    const href = ch.match(/href="(portfolio-reader\/[^"#]+)"/)?.[1];
    const img = ch.match(/<div class="image_container_img">\s*<img[^>]+src="([^"]+)"/)?.[1];
    const titleRaw = ch.match(/<h5 class="title">([\s\S]*?)<\/h5>/)?.[1];
    const catRaw = ch.match(/<div class="subline">([\s\S]*?)<\/div>/)?.[1];
    if (!href || !titleRaw) continue;
    items.push({
      href: decodeURIComponent(href),
      title: stripTags(titleRaw).replace(/\s+/g, " ").trim(),
      category: normalizeCategory(stripTags(catRaw ?? "")),
      image: decodeURIComponent(img ?? ""),
    });
  }
  return items;
}

async function fetchDetail(href: string) {
  const res = await fetch(`${BASE}/${href}`);
  if (!res.ok) return { description: null as string | null, year: null as number | null, gallery: [] as string[] };
  const html = await res.text();

  let description: string | null = null;
  const ce = html.match(/Projektbeschreibung[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (ce) {
    description = stripTags(ce[1] ?? "");
  }
  if (!description || description.length < 40) {
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripTags(m[1] ?? ""))
      .filter(
        (t) =>
          t.length > 60 &&
          !/cookie|browser|schnellübersicht|tragwerker gmbh südend/i.test(t) &&
          !/outdated browser/i.test(t)
      );
    description = paras[0] ?? null;
  }

  const yearMatch = html.match(/<span class="prozent">(\d{4})<\/span>/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  const gallery = [
    ...new Set(
      [...html.matchAll(/src="((?:files\/mediapool\/referenzen|assets\/images)\/[^"]+\.(?:jpg|jpeg|png|JPG|JPEG|PNG))"/g)].map(
        (m) => decodeURIComponent(m[1] ?? "")
      )
    ),
  ].filter((src) => !/mailadressen|office_/i.test(src));

  return { description, year, gallery };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const listing = await fetchListing();
  console.log(`Found ${listing.length} referenzen`);

  let created = 0;
  let updated = 0;

  for (const [index, item] of listing.entries()) {
    const slug = slugify(item.title);
    const location = guessLocation(item.title);
    console.log(`\n[${index + 1}/${listing.length}] ${item.title}`);

    const detail = await fetchDetail(item.href);
    let description =
      detail.description && detail.description.length > 40
        ? detail.description
        : fallbackDescription(item.title, item.category, location);

    // Keep description readable length
    if (description.length > 1200) description = `${description.slice(0, 1197).trim()}…`;

    const excerpt =
      description.length > 160 ? `${description.slice(0, 157).trim()}…` : description;

    const heroLocal = item.image ? await downloadImage(item.image) : null;
    const galleryLocals: string[] = [];
    for (const g of detail.gallery.slice(0, 4)) {
      if (item.image && decodeURIComponent(item.image).endsWith(path.basename(g))) continue;
      const local = await downloadImage(g);
      if (local && local !== heroLocal) galleryLocals.push(local);
      if (galleryLocals.length >= 3) break;
    }

    const data = {
      name: item.title,
      slug,
      author: "Die Tragwerker",
      category: item.category || "Kommunalbau",
      status: "Published" as const,
      description,
      excerpt,
      year: detail.year,
      period: detail.year ? String(detail.year) : null,
      location,
      heroImageUrl: heroLocal,
      galleryUrls: galleryLocals,
      featured: index < 6,
    };

    const existing =
      (await prisma.project.findUnique({ where: { slug } })) ??
      (await prisma.project.findFirst({
        where: { name: { equals: item.title, mode: "insensitive" } },
      }));

    // Map known overlaps from earlier CMS seed
    const aliases: Record<string, string[]> = {
      "erweiterung-fw-germering": ["erweiterung-der-feuerwehr-in-germering"],
      "starzelbachschule-eichenau": ["erweiterung-der-starzelbachschule-in-eichenau"],
      "wohnensemble-limlife": ["wohnanlage-in-der-furstenriederstr"],
      doppelhaus: ["doppelhaus"],
    };
    const aliasSlug = aliases[slug]?.[0];
    const existingAlias = aliasSlug
      ? await prisma.project.findUnique({ where: { slug: aliasSlug } })
      : null;

    const target = existing ?? existingAlias;

    if (target) {
      await prisma.project.update({
        where: { id: target.id },
        data: {
          name: item.title,
          category: data.category,
          status: "Published",
          description: data.description,
          excerpt: data.excerpt,
          year: data.year ?? target.year,
          period: data.period ?? target.period,
          location: data.location ?? target.location,
          heroImageUrl: data.heroImageUrl ?? target.heroImageUrl,
          galleryUrls: data.galleryUrls.length > 0 ? data.galleryUrls : target.galleryUrls,
          featured: Boolean(target.featured || data.featured),
        },
      });
      updated += 1;
      console.log(`  updated ${target.slug}`);
    } else {
      let uniqueSlug = slug;
      let n = 2;
      while (await prisma.project.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${n++}`;
      }
      await prisma.project.create({
        data: {
          ...data,
          slug: uniqueSlug,
        },
      });
      created += 1;
      console.log(`  created ${uniqueSlug}`);
    }
  }

  const total = await prisma.project.count();
  console.log(`\nDone. created=${created} updated=${updated} totalProjects=${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

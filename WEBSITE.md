# Tragwerker Website Layer

The public Tragwerker website is isolated from the HCMS core so upstream CMS updates can be pulled without overwriting the website implementation.

## Architecture

```
HCMS Core (upstream-safe)
├── src/app/(dashboard)/     CMS admin UI  →  /cms, /projects, /login, …
├── src/components/          CMS components (except website)
├── src/lib/                 Shared infra (auth, prisma, seo)
└── prisma/schema.prisma     Core models + website extensions (see migration)

Tragwerker Website (do not overwrite on CMS sync)
├── src/website/tragwerker/  All website logic, components, templates
├── src/app/(site)/          Thin route files only
└── prisma/migrations/*tragwerker_website*
```

## Public URLs

| Page | URL |
|------|-----|
| Home | `/` |
| Menschen | `/menschen` |
| Kompetenzen | `/kompetenzen` |
| Projekte | `/projekte` |
| Projekt Detail | `/projekte/[slug]` |
| Tragwerksplanung | `/tragwerksplanung` |
| Prüfung | `/pruefung` |
| Jobs | `/jobs` |
| Kontakt | `/kontakt` |
| Suche | `/suche` |
| Impressum | `/impressum` |
| Datenschutz | `/datenschutz` |

CMS admin: `/cms` (login required). CMS Jobs: `/cms/jobs`

## CMS Collections

- **Projects** — extended fields for public project pages
- **Team** — TeamMember with expertise, featured, sortOrder
- **Services** — Tragwerksplanung & Prüfung via Service model + JSON sections
- **Jobs** — existing Job model
- **Pages** — homepage, kompetenzen via Page slug + JSON body

## Contact

No forms. All CTAs use `mailto:kontakt@tragwerker.de` or internal links.

## After HCMS git pull

1. Resolve conflicts only in CMS paths — **never** accept upstream changes that delete `src/website/tragwerker/` or `src/app/(site)/`
2. Re-run `npx prisma migrate deploy`
3. Verify `/` loads the public site and `/cms` loads the dashboard

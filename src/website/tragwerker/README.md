# Tragwerker Website Layer

This folder is the **isolated public website** for Tragwerker GmbH.

It runs on top of HCMS and must remain separate from CMS core code so future
`git pull` updates to HCMS do not overwrite Tragwerker-specific work.

## Boundaries

| Layer | Location | Safe to pull from HCMS upstream |
|-------|----------|-----------------------------------|
| CMS core | `src/app/(dashboard)/`, `src/components/` (non-site), `src/lib/` (non-site) | Yes |
| Website | `src/website/tragwerker/`, `src/app/(site)/` | **No — Tragwerker owned** |
| Website DB | `prisma/migrations/*tragwerker_website*` | **No — Tragwerker owned** |

## Routing

- Public site: `/`, `/menschen`, `/projekte`, …
- CMS admin: `/cms`, `/projects`, `/login`, …

## Structure

```
src/website/tragwerker/
  config.ts          Site name, URLs, contact
  navigation.ts      Global menu structure
  queries.ts         Published CMS reads
  metadata.ts        SEO helpers
  types.ts           Shared types
  defaults/          Fallback content when CMS entries are empty
  components/        All presentation components
  templates/         Page-level compositions
```

Route files in `src/app/(site)/` are thin wrappers that import from here.

## Home hero image prompts

Until a dedicated asset exists, `SITE_IMAGES.heroHome` uses the Kompetenzen structural
detail as interim. Generate `public/uploads/media/hero-home.jpg` (16:9 or 21:9), then
point `heroHome` at that path.

Photoreal, natural daylight, palette light wood / gray concrete / steel.
No people, no text, no logo.

**Prompt A — Primary (recommended)**

Close-up, low-angle architectural photograph of a modern hybrid structure: massive
glulam timber beams meeting smooth exposed concrete columns with visible galvanized
steel plate connections and hex bolts; polished concrete floor reflections; soft
daylight from large openings; shallow depth of field; editorial architectural
photography; clean minimal industrial atmosphere; Munich contemporary architecture
mood; 8k, photoreal.

**Prompt B — Alternate (space / scale)**

Wide interior view of a contemporary structural engineering space or atrium: exposed
timber roof structure and concrete cores, long span beams, soft overcast daylight,
quiet empty space, precise material detail, no furniture clutter, photoreal
architectural editorial, cool-neutral palette matching light wood and gray concrete.

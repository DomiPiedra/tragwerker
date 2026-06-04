/**
 * Server-only SEO exports (Prisma). Import from "@/lib/seo/server" in API routes and server actions.
 */
export {
  deleteContentSeo,
  ensureContentSeo,
  getContentSeo,
  getContentSeoBatch,
  getContentSeoData,
  upsertContentSeo,
} from "@/lib/seo/repository";

export {
  generateAndPersistSeoFromDb,
  generateAndPersistSeoFromEditor,
  generateAndPersistSeoMetadata,
} from "@/lib/seo/server/generate-and-persist";

export {
  buildSeoContextFromEditor,
  loadSeoContentContext,
} from "@/lib/seo/server/load-context";

export { scheduleContentSeoGeneration } from "@/lib/seo/server/schedule-generation";

export { seoMetadataService, getSeoMetadataProvider } from "@/lib/seo/ai/seo-metadata-service";

export {
  seoInsightsService,
  getSeoInsightsProvider,
  setSeoInsightsProvider,
} from "@/lib/seo/ai/seo-insights-service";

export {
  prismaContentSeoToContentSeo,
  prismaContentSeoToRecord,
  normalizeContentSeoInput,
  mergeContentSeo,
  contentSeoRef,
} from "@/lib/seo/mappers";

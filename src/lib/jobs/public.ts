import type { Job } from "@/generated/prisma/client";
import { getContentSeo } from "@/lib/seo/server";
import { serializeJob } from "@/lib/jobs/serialize";

export type PublicJob = ReturnType<typeof serializeJob> & {
  featuredImage: string | null;
  seo: {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
    canonicalUrl: string;
    indexable: boolean;
    followLinks: boolean;
  } | null;
};

export async function toPublicJob(job: Job, includeDraft = false): Promise<PublicJob> {
  const base = serializeJob(job);
  if (!includeDraft && !job.published) {
    throw new Error("Job is not published");
  }

  const seoRecord = await getContentSeo({ entityType: "job", entityId: job.id });

  return {
    ...base,
    featuredImage: seoRecord?.seoImage || null,
    seo: seoRecord
      ? {
          seoTitle: seoRecord.seoTitle,
          seoDescription: seoRecord.seoDescription,
          seoKeywords: seoRecord.seoKeywords,
          canonicalUrl: seoRecord.canonicalUrl,
          indexable: seoRecord.indexable,
          followLinks: seoRecord.followLinks,
        }
      : null,
  };
}

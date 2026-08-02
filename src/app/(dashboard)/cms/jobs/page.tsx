import { prisma } from "@/lib/prisma";
import { serializeJob } from "@/lib/jobs/serialize";
import { JobsListClient } from "./jobs-list-client";

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const jobIdRaw = resolvedSearchParams.jobId;
  const viewRaw = resolvedSearchParams.jobView;
  const generateRaw = resolvedSearchParams.generateContent;
  const initialFullViewJobId = Array.isArray(jobIdRaw) ? jobIdRaw[0] : jobIdRaw ?? null;
  const initialIsFullJobView = (Array.isArray(viewRaw) ? viewRaw[0] : viewRaw) === "full";
  const initialGenerateContent =
    (Array.isArray(generateRaw) ? generateRaw[0] : generateRaw) === "1";

  const jobs = await prisma.job.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <JobsListClient
      initialJobs={jobs.map(serializeJob)}
      initialFullViewJobId={initialFullViewJobId}
      initialIsFullJobView={initialIsFullJobView}
      initialGenerateContent={initialGenerateContent}
    />
  );
}

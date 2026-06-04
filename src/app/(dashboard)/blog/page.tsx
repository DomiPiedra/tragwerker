import { prisma } from "@/lib/prisma";
import { BlogListClient } from "./blog-list-client";

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const postIdRaw = resolvedSearchParams.postId;
  const viewRaw = resolvedSearchParams.blogView;
  const initialFullViewPostId = Array.isArray(postIdRaw) ? postIdRaw[0] : postIdRaw ?? null;
  const initialIsFullBlogView = (Array.isArray(viewRaw) ? viewRaw[0] : viewRaw) === "full";
  const generateRaw = resolvedSearchParams.generateContent;
  const initialGenerateContent = (Array.isArray(generateRaw) ? generateRaw[0] : generateRaw) === "1";

  const posts = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
  const serialized = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    published: post.published,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    updatedAt: post.updatedAt.toISOString(),
    createdAt: post.createdAt.toISOString(),
  }));

  return (
    <BlogListClient
      initialPosts={serialized}
      initialFullViewPostId={initialFullViewPostId}
      initialIsFullBlogView={initialIsFullBlogView}
      initialGenerateContent={initialGenerateContent}
    />
  );
}

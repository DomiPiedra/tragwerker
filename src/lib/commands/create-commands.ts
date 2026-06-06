import { createBlogPostFromCommand } from "@/app/actions/createBlogPostFromCommand";
import { stashBlogContentGeneration } from "@/lib/blog/command-bar-generation";

import type { CommandDefinition } from "@/types/command";

export const createCommands: CommandDefinition[] = [
  {
    id: "create-blog-post",
    title: "Create Blog Post",
    description: "Create a new blog post draft and open the editor",
    category: "Create",
    keywords: ["blog", "post", "article", "write", "new", "create", "topic"],
    aliases: [
      "new blog post",
      "create blog post",
      "write blog post",
      "new article",
      "create article",
    ],
    shortcut: ["B"],
    priority: 98,
    icon: "Plus",
    action: async ({ navigate, close, intent }) => {
      const blog = intent?.blog;
      if (blog) {
        const result = await createBlogPostFromCommand({
          ...blog,
          contentHtml: blog.deferContentGeneration ? "<p></p>" : blog.contentHtml,
        });
        if (result.ok) {
          if (blog.deferContentGeneration && blog.generationContext) {
            stashBlogContentGeneration(result.post.id, blog.generationContext);
            navigate(
              `/blog?postId=${encodeURIComponent(result.post.id)}&blogView=full&generateContent=1`
            );
          } else {
            navigate(`/blog?postId=${encodeURIComponent(result.post.id)}&blogView=full`);
          }
          close();
          return;
        }
      }
      navigate("/blog");
      close();
    },
  },
  {
    id: "create-project",
    title: "Create Project",
    description: "Create and open a new project draft",
    category: "Create",
    keywords: ["project", "new", "create", "add"],
    aliases: ["new project", "add project"],
    shortcut: ["P"],
    priority: 95,
    icon: "Plus",
    action: ({ navigate, close }) => {
      navigate("/projects");
      close();
    },
  },
  {
    id: "create-portfolio-item",
    title: "Create Portfolio Item",
    description: "Add a new portfolio item",
    category: "Create",
    keywords: ["portfolio", "item", "new"],
    aliases: ["new portfolio"],
    shortcut: ["O"],
    priority: 88,
    icon: "Plus",
    action: ({ navigate, close }) => {
      navigate("/portfolio");
      close();
    },
  },
  {
    id: "create-team-member",
    title: "Create Team Member",
    description: "Add a new team member",
    category: "Create",
    keywords: ["team", "member", "new", "people"],
    aliases: ["new member"],
    shortcut: ["M"],
    priority: 84,
    icon: "Plus",
    action: ({ navigate, close }) => {
      navigate("/team");
      close();
    },
  },
  {
    id: "create-job",
    title: "Create Job",
    description: "Create a new job listing draft",
    category: "Create",
    keywords: ["job", "career", "hiring", "opening", "position", "new"],
    aliases: ["new job", "create job", "add job listing"],
    shortcut: ["J"],
    priority: 83,
    icon: "Plus",
    action: ({ navigate, close }) => {
      navigate("/jobs");
      close();
    },
  },
];

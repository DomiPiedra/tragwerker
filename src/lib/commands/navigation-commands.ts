import type { CommandDefinition } from "@/types/command";

export const navigationCommands: CommandDefinition[] = [
  {
    id: "nav-dashboard",
    title: "Go to Dashboard",
    description: "Open the dashboard overview",
    category: "Navigation",
    keywords: ["home", "overview", "dashboard", "start"],
    aliases: ["home", "open dashboard"],
    shortcut: ["G", "D"],
    priority: 100,
    icon: "LayoutGrid",
    action: ({ navigate, close }) => {
      navigate("/");
      close();
    },
  },
  {
    id: "nav-projects",
    title: "Go to Projects",
    description: "Open project management",
    category: "Navigation",
    keywords: ["projects", "portfolio work", "work"],
    aliases: ["open projects", "project list"],
    shortcut: ["G", "P"],
    priority: 90,
    icon: "FolderOpen",
    action: ({ navigate, close }) => {
      navigate("/projects");
      close();
    },
  },
  {
    id: "nav-portfolio",
    title: "Go to Portfolio",
    description: "Open portfolio items",
    category: "Navigation",
    keywords: ["portfolio", "case studies", "items"],
    aliases: ["open portfolio"],
    shortcut: ["G", "O"],
    priority: 85,
    icon: "Briefcase",
    action: ({ navigate, close }) => {
      navigate("/portfolio");
      close();
    },
  },
  {
    id: "nav-team",
    title: "Go to Team",
    description: "Open team members",
    category: "Navigation",
    keywords: ["team", "people", "members"],
    aliases: ["open team"],
    shortcut: ["G", "T"],
    priority: 80,
    icon: "Users",
    action: ({ navigate, close }) => {
      navigate("/team");
      close();
    },
  },
  {
    id: "nav-events",
    title: "Go to Events",
    description: "Open events section",
    category: "Navigation",
    keywords: ["events", "calendar", "schedule"],
    aliases: ["open events"],
    shortcut: ["G", "E"],
    priority: 80,
    icon: "Calendar",
    action: ({ navigate, close }) => {
      navigate("/events");
      close();
    },
  },
  {
    id: "nav-blog",
    title: "Go to Blog",
    description: "Open blog posts",
    category: "Navigation",
    keywords: ["blog", "posts", "article"],
    aliases: ["open blog"],
    shortcut: ["G", "B"],
    priority: 80,
    icon: "FileText",
    action: ({ navigate, close }) => {
      navigate("/blog");
      close();
    },
  },
  {
    id: "nav-jobs",
    title: "Go to Jobs",
    description: "Open job listings",
    category: "Navigation",
    keywords: ["jobs", "careers", "hiring", "openings", "positions"],
    aliases: ["open jobs", "careers page"],
    shortcut: ["G", "J"],
    priority: 79,
    icon: "Briefcase",
    action: ({ navigate, close }) => {
      navigate("/jobs");
      close();
    },
  },
  {
    id: "nav-media",
    title: "Go to Media",
    description: "Open media library",
    category: "Navigation",
    keywords: ["media", "assets", "images", "files"],
    aliases: ["open media", "media library"],
    shortcut: ["G", "M"],
    priority: 78,
    icon: "ImageIcon",
    action: ({ navigate, close }) => {
      navigate("/media");
      close();
    },
  },
  {
    id: "nav-analytics",
    title: "Go to Analytics",
    description: "Open analytics overview",
    category: "Navigation",
    keywords: ["analytics", "insights", "metrics", "reports"],
    aliases: ["open analytics", "go to analytics"],
    shortcut: ["G", "A"],
    priority: 77,
    icon: "BarChart3",
    action: ({ navigate, close }) => {
      navigate("/analytics");
      close();
    },
  },
  {
    id: "nav-properties",
    title: "Go to Immobilien",
    description: "Open property listings",
    category: "Navigation",
    keywords: ["immobilien", "properties", "real estate"],
    aliases: ["open immobilien", "open properties"],
    shortcut: ["G", "I"],
    priority: 80,
    icon: "Building2",
    action: ({ navigate, close }) => {
      navigate("/immobilien");
      close();
    },
  },
];

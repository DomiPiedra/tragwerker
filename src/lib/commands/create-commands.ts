import type { CommandDefinition } from "@/types/command";

export const createCommands: CommandDefinition[] = [
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
];

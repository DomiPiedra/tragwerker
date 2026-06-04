import type { CommandDefinition } from "@/types/command";

export const settingsCommands: CommandDefinition[] = [
  {
    id: "settings-open",
    title: "Open Settings",
    description: "Open the settings page",
    category: "Settings",
    keywords: ["settings", "preferences", "users", "links"],
    aliases: ["open settings", "preferences"],
    shortcut: ["S"],
    priority: 85,
    icon: "Settings",
    action: ({ close }) => {
      window.dispatchEvent(new CustomEvent("hcms:open-settings"));
      close();
    },
  },
];

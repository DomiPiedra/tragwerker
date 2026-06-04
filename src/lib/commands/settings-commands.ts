import type { CommandDefinition } from "@/types/command";

export const settingsCommands: CommandDefinition[] = [
  {
    id: "settings-open-modal",
    title: "Open Settings",
    description: "Open the centered settings popup",
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

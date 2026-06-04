import type { CommandDefinition } from "@/types/command";
import type { CommandMetadata } from "@/lib/ai";

import { createCommands } from "./create-commands";
import { navigationCommands } from "./navigation-commands";
import { settingsCommands } from "./settings-commands";

export function getRegisteredCommands(): CommandDefinition[] {
  return [
    ...navigationCommands,
    ...createCommands,
    ...settingsCommands,
  ].sort((a, b) => b.priority - a.priority);
}

export function getCommandMetadata(commands: CommandDefinition[]): CommandMetadata[] {
  return commands.map((command) => ({
    id: command.id,
    title: command.title,
    description: command.description,
    category: command.category,
    keywords: command.keywords,
    aliases: command.aliases ?? [],
    priority: command.priority,
  }));
}

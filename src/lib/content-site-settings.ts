import { ProjectStatus } from "@/generated/prisma/enums";

export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export function splitLocalDateTime(value: string) {
  if (!value) return { date: "", time: "" };
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

export function mergeLocalDateTime(date: string, time: string) {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

export function isProjectStatusPublished(status: ProjectStatus): boolean {
  return status === ProjectStatus.Published;
}

export function projectStatusFromPublished(published: boolean): ProjectStatus {
  return published ? ProjectStatus.Published : ProjectStatus.Draft;
}

export function isPropertyStatusPublished(status: string): boolean {
  return status === "active" || status === "sold";
}

export function propertyStatusFromPublished(published: boolean, current: string): string {
  if (published) {
    return current === "sold" ? "sold" : "active";
  }
  return "draft";
}

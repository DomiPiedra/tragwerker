export function formatSeoGeneratedAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Last generated just now";
  if (minutes < 60) {
    return `Last generated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Last generated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Last generated ${days} day${days === 1 ? "" : "s"} ago`;
  }
  return `Last generated ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)}`;
}

const FULL_VIEW_PARAMS = [
  "blogView",
  "projectView",
  "portfolioView",
  "teamView",
  "eventView",
  "propertyView",
] as const;

export function isContentFullView(searchParams: URLSearchParams): boolean {
  return FULL_VIEW_PARAMS.some((key) => searchParams.get(key) === "full");
}

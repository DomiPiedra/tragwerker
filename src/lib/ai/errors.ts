export function isRateLimitError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const statusCode = (error as { statusCode?: number }).statusCode;
  const status = (error as { status?: number }).status;
  const code = String((error as { code?: string }).code ?? "");
  const message = String((error as { message?: string }).message ?? "").toLowerCase();
  return statusCode === 429 || status === 429 || code.includes("429") || message.includes("429");
}

export function isModelNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const statusCode = (error as { statusCode?: number }).statusCode;
  const status = (error as { status?: number }).status;
  const message = String((error as { message?: string }).message ?? "").toLowerCase();
  return statusCode === 404 || status === 404 || message.includes("model") || message.includes("not found");
}

/** Try the next model in the fallback chain (Gemini backup, wrong key, etc.). */
export function isRetryableAIError(error: unknown) {
  if (isRateLimitError(error)) return true;
  if (isModelNotFoundError(error)) return true;
  if (!error || typeof error !== "object") return false;
  const statusCode = (error as { statusCode?: number }).statusCode;
  const status = (error as { status?: number }).status;
  if (statusCode === 401 || statusCode === 403 || status === 401 || status === 403) return true;
  const message = String((error as { message?: string }).message ?? "").toLowerCase();
  return (
    message.includes("api key") ||
    message.includes("invalid") ||
    message.includes("unauthorized") ||
    message.includes("quota")
  );
}

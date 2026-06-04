/** Media asset attached to a command bar session (dashboard or global command palette). */
export type CommandAttachment = {
  id: string;
  url: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export function isImageAttachment(mimeType: string): boolean {
  if (mimeType.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)$/i.test(mimeType);
}

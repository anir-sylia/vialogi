import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const BUCKET = "chat-media";

function extFromMime(mime: string): string {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mp4")) return "m4a";
  return "bin";
}

export async function uploadChatMedia(
  shipmentId: string,
  blob: Blob,
  mimeHint: string,
): Promise<{ publicUrl: string } | { error: string }> {
  const supabase = createSupabaseBrowserClient();
  const ext = extFromMime(mimeHint || blob.type || "");
  const path = `${shipmentId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || mimeHint || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    console.error("uploadChatMedia:", error.message);
    return { error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

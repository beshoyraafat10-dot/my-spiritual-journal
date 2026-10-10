// Paints the signed-in user's cover: their uploaded photo walking beside Jesus,
// in the style of the app's cover. Runs in the background and records progress in
// profiles.cover_status so the app can poll. Text is added by the app, not the model.
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
const MODEL = Deno.env.get("OPENAI_IMAGE_MODEL") ?? "gpt-image-1";
const QUALITY = Deno.env.get("OPENAI_IMAGE_QUALITY") ?? "medium";
const MAX_GENERATIONS = Number(Deno.env.get("COVER_MAX_GENERATIONS") ?? "3");
const REFERENCE_URL = Deno.env.get("COVER_REFERENCE_URL") ?? "https://beshoyraafat10-dot.github.io/my-spiritual-journal/cover-reference.jpg";

const PROMPT = `Create a warm, painterly yet photorealistic devotional illustration in portrait orientation.
Scene: golden sunset over a winding stone path through the hills of Galilee, olive trees, rocks and small white flowers along the path, a small cross glowing on a distant hill beneath the sun, soft sun rays and glowing clouds.
Jesus — matching the face, long hair, beard, cream robe and beige fringed shawl in the second image — walks beside the person from the first image with His arm around their shoulders. They smile at each other as they walk toward the viewer.
The person must clearly be the same person as in the first image: keep their face, age, hairstyle, skin tone, glasses or beard if any, and their clothing.
Show both from head to below the knees, standing in the lower two-thirds of the image. Keep the top third as open bright sky with no people or objects, so a title can be placed there.
Absolutely no text, letters, words, frames or borders anywhere in the image.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!OPENAI_KEY) return json({ error: "not_configured" }, 503);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await admin.auth.getUser(token);
  const user = auth?.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  const { data: profile, error } = await admin
    .from("profiles")
    .select("avatar_url, cover_status, cover_generations")
    .eq("user_id", user.id)
    .single();
  if (error || !profile) return json({ error: "no_profile" }, 400);
  if (!profile.avatar_url || /^https?:/.test(profile.avatar_url)) return json({ error: "no_photo" }, 400);
  if (profile.cover_status === "pending") return json({ status: "pending" }, 202);
  if (profile.cover_generations >= MAX_GENERATIONS) return json({ error: "limit", remaining: 0 }, 429);

  // Claim an attempt atomically so double taps can't exceed the limit.
  const used = profile.cover_generations;
  const { data: claimed } = await admin
    .from("profiles")
    .update({ cover_status: "pending", cover_generations: used + 1 })
    .eq("user_id", user.id)
    .eq("cover_generations", used)
    .select("user_id");
  if (!claimed?.length) return json({ status: "pending" }, 202);

  EdgeRuntime.waitUntil(paint(admin, user.id, profile.avatar_url, used));
  return json({ status: "pending", remaining: MAX_GENERATIONS - used - 1 }, 202);
});

async function paint(admin: ReturnType<typeof createClient>, userId: string, avatarPath: string, usedBefore: number) {
  try {
    const photo = await admin.storage.from("avatars").download(avatarPath);
    if (photo.error) throw photo.error;
    const ref = await fetch(REFERENCE_URL);
    if (!ref.ok) throw new Error(`reference image ${ref.status}`);

    const form = new FormData();
    form.append("model", MODEL);
    form.append("image[]", new File([photo.data], "person.jpg", { type: photo.data.type || "image/jpeg" }));
    form.append("image[]", new File([await ref.blob()], "jesus.jpg", { type: "image/jpeg" }));
    form.append("prompt", PROMPT);
    form.append("size", "1024x1536");
    form.append("quality", QUALITY);
    form.append("input_fidelity", "high");
    form.append("output_format", "jpeg");
    form.append("n", "1");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      body: form,
    });
    const out = await res.json();
    if (!res.ok) throw new Error(`openai ${res.status}: ${JSON.stringify(out?.error ?? out).slice(0, 500)}`);
    const b64: string | undefined = out?.data?.[0]?.b64_json;
    if (!b64) throw new Error("openai returned no image");

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${userId}/cover.jpg`;
    const up = await admin.storage.from("avatars").upload(path, bytes, { upsert: true, contentType: "image/jpeg", cacheControl: "60" });
    if (up.error) throw up.error;
    await admin.from("profiles").update({ cover_url: path, cover_status: "ready" }).eq("user_id", userId);
  } catch (e) {
    console.error("generate-cover failed", e);
    // A failure on our side or OpenAI's shouldn't cost the person one of their tries.
    await admin.from("profiles").update({ cover_status: "failed", cover_generations: usedBefore }).eq("user_id", userId);
  }
}

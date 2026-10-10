import { useQuery } from "@tanstack/react-query";
import { MAX_COVER_PAINTS, getAvatarUrl, getProfile } from "./data";
import { useAuth } from "./auth";

/** The signed-in person's name, photo and painted cover, shared by the cover and profile screens. */
export function useMe() {
  const { session } = useAuth();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: !!session,
    // While the cover is being painted, check back until it's ready.
    refetchInterval: (q) => (q.state.data?.cover_status === "pending" ? 4000 : false),
  });
  const p = profile.data;
  const path = p?.avatar_url ?? null;
  const photo = useQuery({ queryKey: ["avatar", path], queryFn: () => getAvatarUrl(path), enabled: !!path, staleTime: 1000 * 60 * 60 });
  const coverPath = p?.cover_status === "ready" ? p.cover_url : null;
  const cover = useQuery({
    queryKey: ["cover", coverPath, p?.cover_generations],
    queryFn: () => getAvatarUrl(coverPath),
    enabled: !!coverPath,
    staleTime: 1000 * 60 * 60,
  });
  const meta = (session?.user.user_metadata ?? {}) as Record<string, string | undefined>;
  const rawName = p?.display_name ?? meta["full_name"] ?? null;
  // Older profiles fell back to the email address; don't print that on the cover.
  const name = rawName && !rawName.includes("@") ? rawName : null;
  return {
    profile,
    name,
    photoUrl: photo.data ?? null,
    coverUrl: cover.data ?? null,
    painting: p?.cover_status === "pending",
    paintFailed: p?.cover_status === "failed",
    paintsLeft: Math.max(0, MAX_COVER_PAINTS - (p?.cover_generations ?? 0)),
    email: session?.user.email ?? null,
  };
}

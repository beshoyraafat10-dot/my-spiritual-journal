import { useQuery } from "@tanstack/react-query";
import { getAvatarUrl, getProfile, isCutout } from "./data";
import { useAuth } from "./auth";

/** The signed-in person's name and cover photo URL, shared by the cover and profile screens. */
export function useMe() {
  const { session } = useAuth();
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile, enabled: !!session });
  const path = profile.data?.avatar_url ?? null;
  const photo = useQuery({ queryKey: ["avatar", path], queryFn: () => getAvatarUrl(path), enabled: !!path, staleTime: 1000 * 60 * 60 });
  const meta = (session?.user.user_metadata ?? {}) as Record<string, string | undefined>;
  const rawName = profile.data?.display_name ?? meta["full_name"] ?? null;
  // Older profiles fell back to the email address; don't print that on the cover.
  const name = rawName && !rawName.includes("@") ? rawName : null;
  return { profile, name, photoUrl: photo.data ?? null, photoIsCutout: isCutout(path), email: session?.user.email ?? null };
}

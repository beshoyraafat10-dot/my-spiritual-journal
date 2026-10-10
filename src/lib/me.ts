import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAvatarUrl, getProfile, isCutout, upgradeToCutout } from "./data";
import { useAuth } from "./auth";

/** The signed-in person's name and cover photo URL, shared by the cover and profile screens. */
export function useMe() {
  const { session } = useAuth();
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile, enabled: !!session });
  const path = profile.data?.avatar_url ?? null;
  const photo = useQuery({ queryKey: ["avatar", path], queryFn: () => getAvatarUrl(path), enabled: !!path, staleTime: 1000 * 60 * 60 });
  const qc = useQueryClient();
  const photoUrl = photo.data ?? null;
  const cutout = isCutout(path);

  // Photos uploaded before cut-outs existed: convert once, in the background.
  useEffect(() => {
    if (!path || cutout || !photoUrl) return;
    const key = `khalwety-cutout-tried:${path}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      return;
    }
    void upgradeToCutout(photoUrl)
      .then((ok) => {
        if (ok) void qc.invalidateQueries({ queryKey: ["profile"] });
      })
      .catch((e) => console.error("cutout upgrade failed", e));
  }, [path, cutout, photoUrl, qc]);

  const meta = (session?.user.user_metadata ?? {}) as Record<string, string | undefined>;
  const rawName = profile.data?.display_name ?? meta["full_name"] ?? null;
  // Older profiles fell back to the email address; don't print that on the cover.
  const name = rawName && !rawName.includes("@") ? rawName : null;
  return { profile, name, photoUrl, photoIsCutout: cutout, email: session?.user.email ?? null };
}

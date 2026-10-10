// Minimal service worker so the app is installable on phones.
// It deliberately caches nothing: journal data is live from Supabase,
// and every visit always gets the latest published version.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

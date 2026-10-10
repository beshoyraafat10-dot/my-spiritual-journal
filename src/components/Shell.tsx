import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BookOpen, Search, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Watermark } from "@/components/Ornate";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex rounded-full border border-gold/60 bg-paper/80 p-0.5 text-xs font-semibold" dir="ltr">
      {(["ar", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-full px-3 py-1 transition ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const tab = "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] text-muted-foreground transition";
  const active = { className: "text-ink font-bold [&_svg]:text-gold-deep" };
  return (
    <div className="relative min-h-screen">
      <Watermark />
      <header className="sticky top-0 z-30 border-b border-gold/40 bg-parchment/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
          <Link to="/home" className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
            <span className="text-gold-deep">✝</span>
            {t("appName")}
          </Link>
          <LangToggle />
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-28 pt-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/40 bg-parchment/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-stretch gap-1 px-4 py-1.5">
          <Link to="/home" className={tab} activeProps={active}>
            <BookOpen className="h-6 w-6" strokeWidth={1.6} />
            {t("home")}
          </Link>
          <Link to="/search" className={tab} activeProps={active}>
            <Search className="h-6 w-6" strokeWidth={1.6} />
            {t("search")}
          </Link>
          <Link to="/profile" className={tab} activeProps={active}>
            <UserRound className="h-6 w-6" strokeWidth={1.6} />
            {t("profile")}
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">{children}</div>;
}

export function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/40 border-t-gold-deep" />;
}

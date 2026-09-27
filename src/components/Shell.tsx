import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex rounded-full border border-gold/50 bg-card/70 p-0.5 text-xs font-semibold" dir="ltr">
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
  const nav = "rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-primary";
  const active = { className: "bg-secondary text-primary font-semibold" };
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-16">
      <header className="sticky top-0 z-20 -mx-4 mb-6 flex items-center justify-between gap-2 bg-background/85 px-4 py-3 backdrop-blur">
        <Link to="/home" className="font-display text-2xl font-semibold text-primary">
          {t("appName")}
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/home" className={nav} activeProps={active}>{t("home")}</Link>
          <Link to="/search" className={nav} activeProps={active}>{t("search")}</Link>
          <Link to="/profile" className={nav} activeProps={active}>{t("profile")}</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

export function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center text-muted-foreground">{children}</div>;
}

export function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-2 border-lavender border-t-primary" />;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { bootstrapUser } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { Centered, Spinner } from "@/components/Shell";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({ meta: [{ title: "Signing in… | Khalwety" }, { name: "robots", content: "noindex" }] }),
  component: Callback,
});

function Callback() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [err, setErr] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        let { data } = await supabase.auth.getSession();
        if (!data.session && code) {
          const ex = await supabase.auth.exchangeCodeForSession(code);
          if (ex.error) throw ex.error;
          data = { session: ex.data.session };
        }
        if (!data.session) throw new Error("no session");
        await bootstrapUser(lang);
        localStorage.removeItem("khalwety-auth-intent");
        navigate({ to: "/home", replace: true });
      } catch (e) {
        console.error(e);
        setErr(true);
      }
    })();
  }, [lang, navigate]);

  return (
    <Centered>
      {err ? (
        <>
          <p>{t("errorGeneric")}</p>
          <button onClick={() => navigate({ to: "/" })} className="rounded-full bg-primary px-5 py-2 text-primary-foreground">{t("retry")}</button>
        </>
      ) : (
        <>
          <Spinner />
          <p>{t("completing")}</p>
        </>
      )}
    </Centered>
  );
}

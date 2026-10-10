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
  // A confirmation link opened in another browser can't finish signing in there,
  // but Supabase has already confirmed the email by the time it redirects here.
  const [confirmedElsewhere, setConfirmedElsewhere] = useState(false);
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
        const params = new URLSearchParams(window.location.search);
        if (params.has("code") && !params.has("error")) setConfirmedElsewhere(true);
        else setErr(true);
      }
    })();
  }, [lang, navigate]);

  return (
    <Centered>
      {confirmedElsewhere ? (
        <>
          <p>{t("emailConfirmed")}</p>
          <button onClick={() => navigate({ to: "/" })} className="rounded-full bg-primary px-5 py-2 text-primary-foreground">{t("signIn")}</button>
        </>
      ) : err ? (
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

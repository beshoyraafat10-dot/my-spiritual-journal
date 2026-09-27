import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { searchJournal } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/journey";
import { Centered, Spinner } from "@/components/Shell";

export const Route = createFileRoute("/_app/search")({
  head: () => ({ meta: [{ title: "Search | Khalwety" }, { name: "description", content: "Search your private journal." }] }),
  component: SearchPage,
});

function SearchPage() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => { const id = setTimeout(() => setDebounced(q.trim()), 350); return () => clearTimeout(id); }, [q]);
  const sq = useQuery({ queryKey: ["search", debounced], queryFn: () => searchJournal(debounced), enabled: debounced.length > 0 });

  return (
    <div className="space-y-5">
      <input autoFocus className="field paper-card text-lg" placeholder={t("searchPh")} value={q} onChange={(e) => setQ(e.target.value)} />
      {!debounced ? <Centered><p>{t("searchEmpty")}</p></Centered>
        : sq.isLoading ? <Centered><Spinner /></Centered>
        : sq.error ? <Centered><p>{t("errorGeneric")}</p></Centered>
        : !sq.data?.length ? <Centered><p>{t("noResults")}</p></Centered>
        : (
          <ul className="space-y-3">
            {sq.data.map((h) => (
              <li key={h.day_number}>
                <Link to="/day/$dayNumber" params={{ dayNumber: String(h.day_number) }} className="paper-card block p-4 transition hover:-translate-y-0.5">
                  <p className="text-xs text-gold">{t("day")} {formatNumber(h.day_number, lang)} · {formatDate(h.entry_date, lang)}</p>
                  <p className="mt-1 line-clamp-2 text-foreground">{h.snippet}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

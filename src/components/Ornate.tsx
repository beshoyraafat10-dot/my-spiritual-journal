import { useLayoutEffect, useRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import corner from "@/assets/ornament-corner.png";
import cross from "@/assets/ornament-cross.png";
import divider from "@/assets/ornament-divider.png";
import flourish from "@/assets/ornament-flourish.png";
import watermark from "@/assets/watermark-logo.png";
import jesus from "@/assets/cover-jesus.jpg";
import { useI18n } from "@/lib/i18n";

/** The اجتماع الخريجين logo, faded behind every screen like the printed page. */
export function Watermark() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
      <img src={watermark} alt="" className="w-[min(82vw,520px)] opacity-[0.09]" />
    </div>
  );
}

// Physical corners: the artwork is drawn for the top-left and mirrored for the rest.
const CORNERS = [
  "left-0 top-0",
  "right-0 top-0 -scale-x-100",
  "left-0 bottom-0 -scale-y-100",
  "right-0 bottom-0 -scale-x-100 -scale-y-100",
];

export function Corners({ size = "w-16 sm:w-20" }: { size?: string }) {
  return (
    <>
      {CORNERS.map((c) => (
        <img key={c} src={corner} alt="" aria-hidden className={`pointer-events-none absolute ${c} ${size} select-none`} />
      ))}
    </>
  );
}

/** A parchment sheet with the gold double frame and corner ornaments. */
export function ParchmentPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`parchment gold-frame relative rounded-[1.25rem] ${className}`}>
      <Corners />
      <div className="relative px-7 pb-14 pt-8 sm:px-12">{children}</div>
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <img src={cross} alt="" aria-hidden className="-mt-4 w-40" />
      <h1 className="mt-1 text-4xl text-ink sm:text-5xl">{children}</h1>
      <Divider className="mt-1" />
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <img src={divider} alt="" aria-hidden className={`mx-auto w-[min(80%,22rem)] ${className}`} />;
}

/** "⊱❧ Title ❧⊰" heading used for each question on the page. */
export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-2 text-center">
      <h2 className="flex items-center justify-center gap-3 font-body text-xl font-bold text-ink sm:text-2xl">
        <img src={flourish} alt="" aria-hidden className="w-9 -scale-x-100" />
        <span>{title}</span>
        <img src={flourish} alt="" aria-hidden className="w-9" />
      </h2>
      {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Auto-growing textarea drawn on ruled lines. */
export function RuledText({ minRows = 1, value, className = "", ...rest }: { minRows?: number; value: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const line = parseFloat(getComputedStyle(el).lineHeight) || 36;
    el.style.height = `${Math.max(el.scrollHeight, line * minRows)}px`;
  }, [value, minRows]);
  return <textarea ref={ref} rows={minRows} value={value} className={`ruled ${className}`} {...rest} />;
}

/**
 * The journey cover: Jesus on the path, the person's own photo beside Him,
 * and "وَسَارَ <name> مَعَ اللهِ" (Genesis 6:9) with their name.
 */
export function JourneyCover({
  name,
  photoUrl,
  footer,
  onPickPhoto,
}: {
  name?: string | null;
  photoUrl?: string | null;
  footer?: ReactNode;
  onPickPhoto?: (() => void) | undefined;
}) {
  const { t, lang } = useI18n();
  const walker = name?.trim() || t("defaultWalker");
  const special = <span className="name-special text-[1.3em]">{walker}</span>;
  const verse = lang === "ar" ? <>وَسَارَ {special} مَعَ اللهِ</> : <>And {special} walked with God</>;
  return (
    <div dir="ltr" className="relative aspect-[3/4.2] w-full overflow-hidden rounded-[1.4rem] bg-[#e9c88c] shadow-[var(--shadow-cover)]">
      {/* Soft golden backdrop drawn from the same scene */}
      <img src={jesus} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover object-right blur-xl brightness-110 saturate-125" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fff3d6]/85 via-[#fff3d6]/10 to-[#7a4e1c]/25" />
      {/* Jesus walks on the right, looking toward the person */}
      {/* Nested masks: the wrapper fades the left edge, the image fades its top into the sky */}
      <div className="absolute bottom-0 right-0 h-[68%] w-[80%] [-webkit-mask-image:linear-gradient(to_right,transparent,black_24%)] [mask-image:linear-gradient(to_right,transparent,black_24%)]">
        <img
          src={jesus}
          alt={t("jesusAlt")}
          className="h-full w-full object-cover object-left-top [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_16%)] [mask-image:linear-gradient(to_bottom,transparent,black_16%)]"
        />
      </div>
      {/* The person's photo in an arched gold frame */}
      <div className="absolute bottom-[18%] left-[6%] w-[38%]">
        <div className="rounded-t-full bg-gradient-to-b from-[#f6dc93] via-[#b8862b] to-[#f0cf7a] p-[5px] shadow-[0_16px_30px_-12px_rgba(60,35,10,0.7)]">
          <div className="aspect-[3/4] overflow-hidden rounded-t-full bg-[#f7ecd5]">
            {photoUrl ? (
              <img src={photoUrl} alt={walker} className="h-full w-full object-cover" />
            ) : (
              <button
                type="button"
                onClick={onPickPhoto}
                disabled={!onPickPhoto}
                className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center text-[#7a5523]"
              >
                <svg viewBox="0 0 24 24" className="h-1/3 w-1/3 opacity-60" fill="currentColor" aria-hidden>
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z" />
                </svg>
                {onPickPhoto && <span dir="auto" className="text-xs font-semibold">{t("addPhoto")}</span>}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Title and verse */}
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-7 text-center">
        <img src={divider} alt="" aria-hidden className="w-40 rotate-180 opacity-90" />
        <h1 className="gold-text font-display text-[2.6rem] leading-tight drop-shadow-[0_2px_1px_rgba(255,240,200,0.6)] sm:text-5xl">{t("coverTitle")}</h1>
        <img src={divider} alt="" aria-hidden className="w-56" />
        <p className="mt-1 font-display text-2xl font-bold text-[#4a2e12] drop-shadow-[0_1px_0_rgba(255,245,220,0.8)] sm:text-[1.7rem]">{verse}</p>
        <p className="text-sm font-semibold text-[#5a3a17]/90">{t("verseRef")}</p>
      </div>
      {/* Name plate */}
      <div className="absolute inset-x-[8%] bottom-[4.5%]">
        <div className="rounded-xl bg-gradient-to-b from-[#f4d98f] via-[#b8862b] to-[#f4d98f] p-[3px] shadow-lg">
          <div dir={lang === "ar" ? "rtl" : "ltr"} className="parchment rounded-[0.6rem] px-4 py-2 text-center font-display text-lg font-bold text-ink">
            {footer ?? <span className="name-special text-xl">{walker}</span>}
          </div>
        </div>
      </div>
      {/* Gold frame */}
      <div aria-hidden className="pointer-events-none absolute inset-2 rounded-[1.1rem] border-2 border-[#d9b25a]/90 shadow-[inset_0_0_0_3px_rgba(255,240,200,0.35)]" />
      <Corners size="w-14" />
    </div>
  );
}

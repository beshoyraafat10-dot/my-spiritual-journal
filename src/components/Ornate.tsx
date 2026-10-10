import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type TextareaHTMLAttributes } from "react";
import corner from "@/assets/ornament-corner.png";
import cross from "@/assets/ornament-cross.png";
import divider from "@/assets/ornament-divider.png";
import flourish from "@/assets/ornament-flourish.png";
import watermark from "@/assets/watermark-logo.png";
import plate from "@/assets/cover-plate.webp";
import cartouche from "@/assets/cover-cartouche.webp";
import ghost from "@/assets/cover-ghost.png";
import jesusHand from "@/assets/jesus-hand.png";
import { findHandSpot, type HandSpot } from "@/lib/shoulder";
import { useI18n } from "@/lib/i18n";

/** The اجتماع الخريجين logo, faded behind every screen like the printed page. */
export function Watermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
    >
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
        <img
          key={c}
          src={corner}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute ${c} ${size} select-none`}
        />
      ))}
    </>
  );
}

/** A parchment sheet with the gold double frame and corner ornaments. */
export function ParchmentPage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
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
  return (
    <img src={divider} alt="" aria-hidden className={`mx-auto w-[min(80%,22rem)] ${className}`} />
  );
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
export function RuledText({
  minRows = 1,
  value,
  className = "",
  ...rest
}: { minRows?: number; value: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const line = parseFloat(getComputedStyle(el).lineHeight) || 36;
    el.style.height = `${Math.max(el.scrollHeight, line * minRows)}px`;
  }, [value, minRows]);
  return (
    <textarea ref={ref} rows={minRows} value={value} className={`ruled ${className}`} {...rest} />
  );
}

// ── Cover geometry, in pixels of the original 731×1098 cover design ──────────────
const PLATE_W = 731;
const PLATE_H = 1098;
/** Where the shoulder-finder lands on the man in the original design (a hand-sized box). */
const REF_SPOT = { left: 152.5, top: 410.8, width: 60 };
/** Jesus' hand as drawn on that man's far shoulder. */
const HAND_BOX = { left: 141.75, top: 410.5, width: 57.75, height: 55.5 };
const CARTOUCHE_BOX = { left: 112, top: 865, width: 506.25, height: 192.25 };
/** The man's silhouette, reused as a soft "your place" marker before a photo is added. */
const GHOST_BOX = { left: 99, top: 324, width: 262, height: 581 };
/** A cut-out's lower edge must end behind the name plate, whose top edge is at y=905. */
const MIN_BOTTOM = 922;
const VERSE_Y = 226;
const NAME_PLATE_Y = 946;

type Box = { left: number; top: number; width: number; height: number };
const place = (b: Box): CSSProperties => ({
  left: `${(b.left / PLATE_W) * 100}%`,
  top: `${(b.top / PLATE_H) * 100}%`,
  width: `${(b.width / PLATE_W) * 100}%`,
  height: `${(b.height / PLATE_H) * 100}%`,
});

/** How much a short photo may grow, and then sink, to hide its cut edge before it looks wrong. */
const MAX_GROW = 1.12;
const MAX_SINK = 90;

/**
 * Fits a cut-out (w×h px) so its far shoulder sits under Jesus' hand, where the man stands
 * in the original. Returns null for photos too short to stand (head-and-shoulders selfies).
 */
function fitPerson(w: number, h: number, spot: HandSpot | null): { person: Box; hand: Box | null } | null {
  if (!spot) {
    // No shoulder found: same place, head level with the original, no hand.
    const height = MIN_BOTTOM - 330;
    const width = height * (w / h);
    return { person: { left: 230 - width / 2, top: 330, width, height }, hand: null };
  }
  const s = REF_SPOT.width / (spot.width * w);
  const ax = REF_SPOT.left;
  let ay = REF_SPOT.top;
  let person: Box = { left: ax - s * spot.left * w, top: ay - s * spot.top * h, width: s * w, height: s * h };
  let k = 1;
  const bottom = person.top + person.height;
  if (bottom < MIN_BOTTOM) {
    // Photos cut above the knee: grow a little around the shoulder, then lower them,
    // so the cut edge hides behind the name plate while they stay about Jesus' height.
    k = Math.min(MAX_GROW, (MIN_BOTTOM - ay) / (bottom - ay));
    person = { left: ax - k * (ax - person.left), top: ay - k * (ay - person.top), width: person.width * k, height: person.height * k };
    const dy = Math.max(0, MIN_BOTTOM - (person.top + person.height));
    if (dy > MAX_SINK) return null;
    person.top += dy;
    ay += dy;
  }
  const hand = {
    left: ax + (HAND_BOX.left - REF_SPOT.left) * k,
    top: ay + (HAND_BOX.top - REF_SPOT.top) * k,
    width: HAND_BOX.width * k,
    height: HAND_BOX.height * k,
  };
  return { person, hand };
}

/**
 * The journey cover, built on the printed cover design: Jesus on the golden path,
 * the person standing beside Him with His hand on their shoulder, and
 * "وَسَارَ <name> مَعَ اللهِ" (Genesis 6:9) with their name.
 */
export function JourneyCover({
  name,
  photoUrl,
  photoIsCutout,
  footer,
  onPickPhoto,
}: {
  name?: string | null;
  photoUrl?: string | null;
  /** The photo is a background-free cut-out: stand the person on the path beside Jesus. */
  photoIsCutout?: boolean | undefined;
  footer?: ReactNode;
  onPickPhoto?: (() => void) | undefined;
}) {
  const { t, lang } = useI18n();
  const walker = name?.trim() || t("defaultWalker");
  const special = <span className="name-special text-[1.2em]">{walker}</span>;
  const verse = lang === "ar" ? <>وَسَارَ {special} مَعَ اللهِ</> : <>And {special} walked with God</>;
  return (
    <div
      dir="ltr"
      className="@container relative w-full overflow-hidden rounded-[1.1rem] bg-[#e9c88c] shadow-[var(--shadow-cover)]"
      style={{ aspectRatio: `${PLATE_W} / ${PLATE_H}` }}
    >
      <img src={plate} alt={t("jesusAlt")} className="absolute inset-0 h-full w-full" />
      {photoUrl && photoIsCutout ? (
        <PlacedPerson url={photoUrl} walker={walker} />
      ) : photoUrl ? (
        <FramedPhoto url={photoUrl} walker={walker} />
      ) : (
        <Ghost label={onPickPhoto ? t("addPhoto") : null} onPick={onPickPhoto} />
      )}
      {/* The name plate stands in front of the person, so their cut-off edge hides behind it */}
      <img src={cartouche} alt="" aria-hidden className="pointer-events-none absolute" style={place(CARTOUCHE_BOX)} />
      {/* Sized to sit between the gold divider and "تكوين ٦: ٩", like the printed verse */}
      <FitLine
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="absolute left-[17%] right-[19%] -translate-y-1/2 text-center font-display font-bold leading-none text-[#3a230d] [text-shadow:0_1px_0_rgba(255,244,220,0.9),0_0_10px_rgba(255,238,205,0.9)]"
        style={{ top: `${(VERSE_Y / PLATE_H) * 100}%` }}
        maxCqw={4.1}
      >
        {verse}
      </FitLine>
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="absolute inset-x-[24%] -translate-y-1/2 truncate text-center font-display font-bold text-ink"
        style={{ top: `${(NAME_PLATE_Y / PLATE_H) * 100}%`, fontSize: "4.4cqw" }}
      >
        {footer ?? <span className="name-special">{walker}</span>}
      </div>
    </div>
  );
}

/** The cut-out person on the path, graded warm with a sunlit rim to match the scene, Jesus' hand on their shoulder. */
function PlacedPerson({ url, walker }: { url: string; walker: string }) {
  // undefined = still measuring; null = too short to stand, so it goes in the arched frame
  const [fit, setFit] = useState<ReturnType<typeof fitPerson> | undefined>(undefined);
  useEffect(() => {
    let live = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!live) return;
      let spot: HandSpot | null = null;
      try {
        spot = findHandSpot(img);
      } catch {
        spot = null;
      }
      setFit(fitPerson(img.naturalWidth, img.naturalHeight, spot));
    };
    img.src = url;
    return () => {
      live = false;
    };
  }, [url]);
  if (fit === undefined) return null;
  if (fit === null) return <FramedPhoto url={url} walker={walker} />;
  return (
    <>
      <img
        src={url}
        alt={walker}
        className="absolute max-w-none [filter:sepia(0.24)_saturate(1.12)_brightness(1.04)_drop-shadow(0_0_5px_rgba(255,214,150,0.6))_drop-shadow(0_10px_14px_rgba(70,40,10,0.35))]"
        style={place(fit.person)}
      />
      {fit.hand && <img src={jesusHand} alt="" aria-hidden className="absolute max-w-none" style={place(fit.hand)} />}
    </>
  );
}

/** Fallback when no person could be cut out: the photo in an arched gold frame where they would stand. */
function FramedPhoto({ url, walker }: { url: string; walker: string }) {
  return (
    <div className="absolute" style={place({ left: 126, top: 600, width: 208, height: 300 })}>
      <div className="h-full rounded-t-full bg-gradient-to-b from-[#f6dc93] via-[#b8862b] to-[#f0cf7a] p-[4%] shadow-[0_16px_30px_-12px_rgba(60,35,10,0.7)]">
        {/* A warm sky behind, so a background-free cut-out still fills the frame */}
        <img src={url} alt={walker} className="h-full w-full rounded-t-full bg-gradient-to-b from-[#fff1d2] to-[#e7bf82] object-cover object-top" />
      </div>
    </div>
  );
}

/** Before a photo is added: a soft light where the person will stand, Jesus' hand already on its shoulder. */
function Ghost({ label, onPick }: { label: string | null; onPick?: (() => void) | undefined }) {
  return (
    <>
      <img src={ghost} alt="" aria-hidden className="absolute max-w-none" style={place(GHOST_BOX)} />
      <img src={jesusHand} alt="" aria-hidden className="absolute max-w-none" style={place(HAND_BOX)} />
      {label && (
        <button
          type="button"
          onClick={onPick}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl bg-[#3a230d]/55 px-3 py-2 font-bold text-[#fff4dc] shadow-lg backdrop-blur-[2px]"
          style={{ left: `${(230 / PLATE_W) * 100}%`, top: `${(600 / PLATE_H) * 100}%`, fontSize: "3.6cqw" }}
        >
          <span aria-hidden className="text-[1.6em] leading-none">📷</span>
          <span dir="auto">{label}</span>
        </button>
      )}
    </>
  );
}

/** One line of text in container-width units that shrinks (never grows) to fit its box, e.g. for long names. */
function FitLine({
  children,
  maxCqw,
  className,
  style,
  dir,
}: {
  children: ReactNode;
  maxCqw: number;
  className: string;
  style: CSSProperties;
  dir: "rtl" | "ltr";
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [size, setSize] = useState(maxCqw);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = `${maxCqw}cqw`;
      const ratio = el.clientWidth / Math.max(1, el.scrollWidth);
      setSize(ratio < 1 ? maxCqw * ratio * 0.98 : maxCqw);
    };
    fit();
    void document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, maxCqw]);
  return (
    <p ref={ref} dir={dir} className={`whitespace-nowrap ${className}`} style={{ ...style, fontSize: `${size}cqw` }}>
      {children}
    </p>
  );
}

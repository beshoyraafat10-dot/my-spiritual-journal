// Finds where Jesus' hand should rest on a cut-out person: on their far (viewer's left)
// shoulder, sized to their shoulders. Proportions come from the printed cover, where
// the hand spans ~26% of the shoulder width and sits ~24% in from the outer edge.
export type HandSpot = { left: number; top: number; width: number; ratio: number }; // fractions of the image; ratio = image w/h

const HAND_ASPECT = 248 / 272; // height / width of jesus-hand.png

export function findHandSpot(img: HTMLImageElement): HandSpot | null {
  const W = 160;
  const H = Math.round((img.naturalHeight / img.naturalWidth) * W);
  if (!H) return null;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, W, H);
  const a = ctx.getImageData(0, 0, W, H).data;
  const solid = (x: number, y: number) => (a[(y * W + x) * 4 + 3] ?? 0) > 128;

  const left: number[] = [];
  const width: number[] = [];
  for (let y = 0; y < H; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (solid(x, y)) { if (l < 0) l = x; r = x; }
    left.push(l);
    width.push(l < 0 ? 0 : r - l + 1);
  }
  const top = width.findIndex((w) => w > 2);
  if (top < 0) return null;

  // Head → neck → shoulders: the widest row of the head, then the narrowest row
  // after it (the neck), then the first row that is clearly wider (the shoulders).
  const limit = Math.min(H - 1, top + Math.round(H * 0.6));
  let headPeak = top;
  for (let y = top; y < Math.min(limit, top + Math.round(H * 0.3)); y++) {
    if ((width[y] ?? 0) >= (width[headPeak] ?? 0)) headPeak = y;
    else if ((width[y] ?? 0) < (width[headPeak] ?? 0) * 0.85) break;
  }
  let neck = headPeak;
  for (let y = headPeak; y < limit; y++) {
    if ((width[y] ?? 0) < (width[neck] ?? 0)) neck = y;
    if ((width[y] ?? 0) > (width[headPeak] ?? 0) * 1.3) break;
  }
  let shoulder = -1;
  for (let y = neck; y < limit; y++) {
    if ((width[y] ?? 0) > (width[headPeak] ?? 0) * 1.6) { shoulder = y; break; }
  }
  if (shoulder < 0) shoulder = Math.round(top + (H / W > 1.6 ? 0.2 : 0.38) * (H - top));

  let sw = 0, sl = W;
  for (let y = shoulder; y < Math.min(H, shoulder + Math.round(H * 0.12)); y++) {
    if ((width[y] ?? 0) > sw) { sw = width[y] ?? 0; sl = left[y] ?? 0; }
  }
  if (sw < W * 0.3) return null;

  const handW = sw * 0.26;
  const cx = Math.round(sl + sw * 0.24);
  let surface = shoulder;
  for (let y = top; y < H; y++) if (solid(cx, y)) { surface = y; break; }
  const handTop = surface - sw * 0.092;
  return {
    left: (cx - handW / 2) / W,
    top: handTop / H,
    width: handW / W,
    ratio: W / H,
  };
}

export { HAND_ASPECT };

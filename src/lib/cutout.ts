// Cuts the person out of their photo on the device (MediaPipe selfie segmentation),
// so the cover can show them standing beside Jesus like the printed cover design.
// Nothing is sent anywhere: the model and runtime are downloaded, the photo stays local.
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL = `${import.meta.env.BASE_URL}selfie_segmenter.tflite`;
const MAX_SIDE = 1000;

/** Returns a transparent PNG of just the person, trimmed to them, or null if no person was found. */
export async function cutOutPerson(file: Blob): Promise<Blob | null> {
  const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, w, h);

  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  const segmenter = await ImageSegmenter.createFromOptions(fileset, {
    // A regular canvas for the GL context: Safari can't create WebGL on the
    // OffscreenCanvas MediaPipe would make by default.
    canvas: document.createElement("canvas"),
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
    runningMode: "IMAGE",
    outputConfidenceMasks: true,
    outputCategoryMask: false,
  });
  try {
    const result = segmenter.segment(canvas);
    const mask = result.confidenceMasks?.[0];
    if (!mask) return null;
    const conf = mask.getAsFloat32Array();
    const mw = mask.width;
    const mh = mask.height;
    const img = ctx.getImageData(0, 0, w, h);
    let minX = w, minY = h, maxX = -1, maxY = -1, solid = 0;
    for (let y = 0; y < h; y++) {
      const my = Math.min(mh - 1, Math.floor((y * mh) / h));
      for (let x = 0; x < w; x++) {
        const mx = Math.min(mw - 1, Math.floor((x * mw) / w));
        // Soft threshold keeps hair edges smooth without a halo of background.
        const a = Math.max(0, Math.min(1, ((conf[my * mw + mx] ?? 0) - 0.2) / 0.6));
        img.data[(y * w + x) * 4 + 3] = Math.round(a * 255);
        if (a > 0.5) {
          solid++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    result.close();
    // Too little "person" means it's not a portrait; keep the framed-photo cover instead.
    if (solid < w * h * 0.04) return null;
    ctx.putImageData(img, 0, 0);
    const pad = Math.round(Math.max(w, h) * 0.01);
    const cx = Math.max(0, minX - pad), cy = Math.max(0, minY - pad);
    const cw = Math.min(w, maxX + pad) - cx, ch = Math.min(h, maxY + pad) - cy;
    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    out.getContext("2d")!.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);
    return await new Promise<Blob | null>((res) => out.toBlob(res, "image/png"));
  } finally {
    segmenter.close();
  }
}

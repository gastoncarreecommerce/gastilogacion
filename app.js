/**
 * Hero Builder 1:1 — HiDPI Sharp Canvas
 * - Render a devicePixelRatio (retina) para evitar blur/pixelado
 * - Líneas "crisp" y opcionales
 * - Íconos sin smoothing para que queden bien filosos
 */

const el = (id) => document.getElementById(id);

const canvas = el("canvas");
const ctx = canvas.getContext("2d");

const fileImage = el("fileImage");
const titleText = el("titleText");
const animalSelect = el("animalSelect");
const weightText = el("weightText");
const sizeSelect = el("sizeSelect");
const brandBlue = el("brandBlue");
const showDividers = el("showDividers");
const btnDownload = el("btnDownload");

let baseImg = null;
let scheduled = false;

const ICON_URLS = {
  animal: {
    cow:   "", // PEGAR SVG oficial
    pig:   "",
    chicken:"",
    fish:  "",
    lamb:  ""
  },
  cook: {
    grill: "", // PEGAR SVG oficial
    oven:  "",
    pot:   ""
  }
};

// Fallbacks mínimos (si no pegás URLs)
const FALLBACK_SVGS = {
  animal: {
    cow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M26 42c-4-8-1-17 9-19"/><path d="M70 42c4-8 1-17-9-19"/><path d="M33 37c4-6 9-9 15-9s11 3 15 9"/><path d="M30 53c0-10 8-16 18-16s18 6 18 16v8c0 12-8 20-18 20s-18-8-18-20z"/></g></svg>`,
    pig: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M30 53c0-12 8-20 18-20s18 8 18 20v8c0 12-8 20-18 20s-18-8-18-20z"/></g></svg>`,
    chicken:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M30 56c0-12 9-21 20-21s20 9 20 21-9 21-20 21-20-9-20-21z"/></g></svg>`,
    fish: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M26 52c10-14 30-18 48-8 6 3 10 6 14 8-4 2-8 5-14 8-18 10-38 6-48-8z"/><path d="M26 52l-10-8 2 8-2 8z"/></g></svg>`,
    lamb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M30 54c0-12 8-20 18-20s18 8 18 20v8c0 12-8 20-18 20s-18-8-18-20z"/></g></svg>`
  },
  cook: {
    grill:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 40h40"/><path d="M24 48h32"/><path d="M26 56h28"/></g></svg>`,
    oven:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="18" width="44" height="50" rx="6"/><path d="M18 30h44"/></g></svg>`,
    pot:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 34h36"/><path d="M20 36v8c0 16 8 26 20 26s20-10 20-26v-8"/></g></svg>`
  }
};

function svgToDataUrl(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getIconImage(kind, key) {
  const url = ICON_URLS[kind]?.[key];
  if (url && url.trim()) return await loadImage(url.trim());
  return await loadImage(svgToDataUrl(FALLBACK_SVGS[kind][key]));
}

function loadFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// --- HiDPI canvas setup ---
function setHiDPICanvasSize(cssSize) {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1)); // cap at 3
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  // draw in CSS pixel coordinates
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { dpr };
}

// cover fill (coords in CSS pixels)
function drawCover(img, x, y, w, h) {
  const iw = img.width, ih = img.height;
  const ir = iw / ih;
  const r = w / h;

  let sw, sh, sx, sy;
  if (ir > r) { sh = ih; sw = ih * r; sx = (iw - sw) / 2; sy = 0; }
  else { sw = iw; sh = iw / r; sx = 0; sy = (ih - sh) / 2; }

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// crisp vertical/horizontal line (1px) in CSS pixels
function crispLine(x1, y1, x2, y2, lineWidth = 1) {
  ctx.lineWidth = lineWidth;
  // align to pixel grid for 1px
  const offset = (lineWidth % 2) ? 0.5 : 0;
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + offset, Math.round(y1) + offset);
  ctx.lineTo(Math.round(x2) + offset, Math.round(y2) + offset);
  ctx.stroke();
}

// wrap to 2 lines + ellipsis
function wrap2(ctx, text, maxWidth) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines = [];
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width <= maxWidth) line = test;
    else { lines.push(line || words[i]); line = words[i]; break; }
  }

  // second line from remaining words
  let second = line;
  for (let j = lines.length ? words.indexOf(line.split(" ")[0]) + line.split(" ").length : 0; j < words.length; j++) {
    const test = second ? `${second} ${words[j]}` : words[j];
    if (ctx.measureText(test).width <= maxWidth) second = test;
    else break;
  }

  if (!lines.length) {
    if (ctx.measureText(line).width <= maxWidth) return [line];
    lines.push(line);
  }

  if (second && second !== lines[0]) {
    let s = second;
    const ell = "…";
    while (ctx.measureText(s + ell).width > maxWidth && s.length > 1) s = s.slice(0, -1);
    if (ctx.measureText(second).width > maxWidth) second = s + ell;
    return [lines[0], second];
  }

  return [lines[0]];
}

function getSelectedCooks() {
  return Array.from(document.querySelectorAll(".cook"))
    .filter(cb => cb.checked)
    .map(cb => cb.value)
    .slice(0, 3);
}

async function render() {
  const size = Number(sizeSelect.value);
  setHiDPICanvasSize(size);

  // load font
  if (document.fonts?.load) {
    await document.fonts.load(`700 ${Math.round(size * 0.08)}px Ubuntu`);
  }

  const blue = brandBlue.value;

  // Background
  if (baseImg) drawCover(baseImg, 0, 0, size, size);
  else { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size); }

  // Layout tuned like reference
  const M = Math.round(size * 0.04);
  const headerTop = Math.round(size * 0.03);
  const headerTile = Math.round(size * 0.13);
  const headerGap = Math.round(size * 0.03);

  const footerH = Math.round(size * 0.26);
  const footerY = size - footerH;

  const weightW = Math.round(size * 0.28);
  const leftW = size - weightW;

  // Header tile (blue)
  ctx.fillStyle = blue;
  ctx.fillRect(M, headerTop, headerTile, headerTile);

  // animal icon (white) inside tile (NO blur)
  const animalImg = await getIconImage("animal", animalSelect.value);
  const pad = Math.round(headerTile * 0.18);

  ctx.imageSmoothingEnabled = false; // <-- icons crisp
  ctx.drawImage(animalImg, M + pad, headerTop + pad, headerTile - pad * 2, headerTile - pad * 2);

  // Title (tight, left aligned, 2 lines)
  const title = (titleText.value || "").trim() || "Título";
  const titleX = M + headerTile + headerGap;
  const titleMaxW = size - M - titleX;

  const titleFont = Math.round(size * 0.075);
  ctx.font = `700 ${titleFont}px Ubuntu, sans-serif`;
  ctx.fillStyle = blue;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const lines = wrap2(ctx, title, titleMaxW);
  const lineH = Math.round(titleFont * 1.12);

  const totalH = lines.length * lineH;
  const firstY = headerTop + Math.round((headerTile - totalH) / 2) + lineH;

  lines.forEach((ln, i) => ctx.fillText(ln, titleX, firstY + i * lineH));

  // Footer block
  ctx.fillStyle = blue;
  ctx.fillRect(0, footerY, size, footerH);

  // Dividers (crisp)
  if (showDividers.checked) {
    ctx.strokeStyle = "rgba(255,255,255,0.28)"; // más suave
    // 1px divider in CSS pixels
    crispLine(leftW, footerY, leftW, size, 1);

    const slotW = leftW / 3;
    crispLine(slotW * 1, footerY, slotW * 1, size, 1);
    crispLine(slotW * 2, footerY, slotW * 2, size, 1);
  }

  // Cook icons in 3 slots (like reference)
  const cooks = getSelectedCooks();
  const slotW = leftW / 3;
  const iconSize = Math.round(size * 0.12);
  const iconY = footerY + Math.round((footerH - iconSize) / 2);

  for (let i = 0; i < cooks.length; i++) {
    const img = await getIconImage("cook", cooks[i]);
    const x = Math.round(slotW * i + (slotW - iconSize) / 2);
    ctx.imageSmoothingEnabled = false; // <-- icons crisp
    ctx.drawImage(img, x, iconY, iconSize, iconSize);
  }

  // Weight text (crisp, centered)
  const wText = (weightText.value || "x kg").trim();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.round(size * 0.085)}px Ubuntu, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(wText, leftW + weightW / 2, footerY + footerH / 2);

  btnDownload.disabled = false;
}

function scheduleRender() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(async () => {
    scheduled = false;
    try { await render(); } catch (e) { console.error(e); }
  });
}

// Events
fileImage.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  baseImg = await loadFileAsImage(f);
  scheduleRender();
});

btnDownload.addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = `hero_${(titleText.value || "producto").replace(/\s+/g, "_")}.png`;
  a.href = canvas.toDataURL("image/png"); // exports at DPR resolution
  a.click();
});

// Live inputs
[titleText, animalSelect, weightText, sizeSelect, brandBlue, showDividers].forEach((node) => {
  node.addEventListener("input", scheduleRender);
  node.addEventListener("change", scheduleRender);
});
document.querySelectorAll(".cook").forEach(cb => cb.addEventListener("change", scheduleRender));

// First paint
scheduleRender();

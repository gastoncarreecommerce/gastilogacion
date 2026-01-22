/**
 * Hero Builder 1:1
 * - Layout fijo como la referencia
 * - Íconos se cargan desde URLs (CDN/VTEX assets) para ser 1:1
 * - Header: tile azul + ícono blanco + título pegado (Ubuntu)
 * - Título hasta 2 líneas (con ellipsis)
 * - Footer: 3 slots + bloque peso (divisores opcionales)
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

/**
 * 🔥 IMPORTANTE:
 * Para 1:1 IGUAL, pegá acá las URLs de tus SVG oficiales (VTEX assets / CDN).
 * Ejemplo:
 * cow: "https://carrefourar.vtexassets.com/assets/.../cow.svg"
 */
const ICON_URLS = {
  animal: {
    cow:   "", // <-- PEGAR URL SVG OFICIAL
    pig:   "",
    chicken:"",
    fish:  "",
    lamb:  ""
  },
  cook: {
    grill: "", // <-- PEGAR URL SVG OFICIAL
    oven:  "",
    pot:   ""
  }
};

// Fallbacks (si no pegás URLs, usa SVGs básicos)
const FALLBACK_SVGS = {
  animal: {
    cow: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M26 42c-4-8-1-17 9-19"/>
    <path d="M70 42c4-8 1-17-9-19"/>
    <path d="M33 37c4-6 9-9 15-9s11 3 15 9"/>
    <path d="M30 53c0-10 8-16 18-16s18 6 18 16v8c0 12-8 20-18 20s-18-8-18-20z"/>
    <path d="M40 62h16"/>
    <path d="M41 70c2 2 4 3 7 3s5-1 7-3"/>
  </g>
</svg>`,
    pig: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M30 52c0-12 8-20 18-20s18 8 18 20v8c0 12-8 20-18 20s-18-8-18-20z"/><path d="M38 58c0-2 2-4 4-4h12c2 0 4 2 4 4v6c0 2-2 4-4 4H42c-2 0-4-2-4-4z"/></g></svg>`,
    chicken:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M30 56c0-12 9-21 20-21s20 9 20 21-9 21-20 21-20-9-20-21z"/><path d="M49 46c3 2 8 2 12 0-1 4-4 8-8 8-4 0-7-4-8-8 1 0 2 0 4 0"/></g></svg>`,
    fish:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M26 52c10-14 30-18 48-8 6 3 10 6 14 8-4 2-8 5-14 8-18 10-38 6-48-8z"/><path d="M26 52l-10-8 2 8-2 8z"/></g></svg>`,
    lamb:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M30 54c0-12 8-20 18-20s18 8 18 20v8c0 12-8 20-18 20s-18-8-18-20z"/><path d="M33 40c-6-6-2-16 8-16"/><path d="M63 40c6-6 2-16-8-16"/></g></svg>`
  },
  cook: {
    grill:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 40h40"/><path d="M24 48h32"/><path d="M26 56h28"/><path d="M26 62l-4 10"/><path d="M54 62l4 10"/><path d="M30 20c0 6-6 6-6 12"/><path d="M40 18c0 6-6 6-6 12"/><path d="M50 20c0 6-6 6-6 12"/></g></svg>`,
    oven:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="18" width="44" height="50" rx="6"/><path d="M18 30h44"/><circle cx="28" cy="25" r="2"/><circle cx="36" cy="25" r="2"/><circle cx="44" cy="25" r="2"/><path d="M28 48h24"/></g></svg>`,
    pot:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 34h36"/><path d="M20 36v8c0 16 8 26 20 26s20-10 20-26v-8"/><path d="M16 40c-4 2-4 10 0 12"/><path d="M64 40c4 2 4 10 0 12"/></g></svg>`
  }
};

function svgToDataUrl(svg, fillColor = null) {
  let s = svg;
  if (fillColor) {
    // not used here; kept for extensibility
    s = s.replaceAll("white", fillColor);
  }
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // allow cross origin icons if CDN supports it
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getIconImage(kind, key) {
  const url = ICON_URLS[kind]?.[key];
  if (url && url.trim()) {
    return await loadImage(url.trim());
  }
  // fallback
  const svg = FALLBACK_SVGS[kind][key];
  return await loadImage(svgToDataUrl(svg));
}

function loadFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// cover fill
function drawCover(img, x, y, w, h) {
  const iw = img.width, ih = img.height;
  const ir = iw / ih;
  const r = w / h;

  let sw, sh, sx, sy;
  if (ir > r) {
    sh = ih;
    sw = ih * r;
    sx = (iw - sw) / 2;
    sy = 0;
  } else {
    sw = iw;
    sh = iw / r;
    sx = 0;
    sy = (ih - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// wrap max 2 lines + ellipsis
function wrap2(ctx, text, maxWidth) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines = [];
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      lines.push(line || words[i]);
      line = words[i];
      if (lines.length === 1) break; // already have first line, stop to build second
    }
  }

  // Build second line with remaining words
  let second = line;
  for (let j = lines.length ? words.indexOf(line.split(" ")[0]) + line.split(" ").length : 0; j < words.length; j++) {
    const test = second ? `${second} ${words[j]}` : words[j];
    if (ctx.measureText(test).width <= maxWidth) second = test;
    else break;
  }

  if (lines.length === 0) {
    // all fit in one line
    if (ctx.measureText(line).width <= maxWidth) return [line];
  }

  if (lines.length === 0) lines.push(line);

  if (second && second !== lines[0]) {
    // ellipsis if needed
    let s = second;
    const ell = "…";
    while (ctx.measureText(s + ell).width > maxWidth && s.length > 1) {
      s = s.slice(0, -1);
    }
    // If we cut, add ell
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
  canvas.width = size;
  canvas.height = size;

  // Font load
  if (document.fonts?.load) {
    await document.fonts.load(`700 ${Math.round(size * 0.08)}px Ubuntu`);
  }

  const blue = brandBlue.value;

  // Background photo
  if (baseImg) {
    drawCover(baseImg, 0, 0, size, size);
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
  }

  // === Layout ratios tuned for 500×500 reference ===
  const M = Math.round(size * 0.04);              // outer margin
  const headerTile = Math.round(size * 0.13);     // blue square in header
  const headerGap = Math.round(size * 0.03);      // gap between tile and title
  const headerTop = Math.round(size * 0.03);      // y offset
  const footerH = Math.round(size * 0.26);        // footer height
  const footerY = size - footerH;
  const weightW = Math.round(size * 0.28);        // right block width
  const leftW = size - weightW;

  // === Header tile (blue) ===
  ctx.fillStyle = blue;
  ctx.fillRect(M, headerTop, headerTile, headerTile);

  // animal icon (white) centered in tile
  const animalKey = animalSelect.value;
  const animalImg = await getIconImage("animal", animalKey);

  const animalPad = Math.round(headerTile * 0.18);
  ctx.drawImage(
    animalImg,
    M + animalPad,
    headerTop + animalPad,
    headerTile - animalPad * 2,
    headerTile - animalPad * 2
  );

  // === Title (left aligned, tight like reference) ===
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

  // Align vertically within header tile area (like reference)
  const totalH = lines.length * lineH;
  const firstY = headerTop + Math.round((headerTile - totalH) / 2) + lineH;

  lines.forEach((ln, i) => {
    ctx.fillText(ln, titleX, firstY + i * lineH);
  });

  // === Footer ===
  ctx.fillStyle = blue;
  ctx.fillRect(0, footerY, size, footerH);

  // dividers (like reference)
  if (showDividers.checked) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = Math.max(2, Math.round(size * 0.004));

    // between left area and weight
    ctx.beginPath();
    ctx.moveTo(leftW, footerY);
    ctx.lineTo(leftW, size);
    ctx.stroke();

    // 3 slots in left area
    const slotW = leftW / 3;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.round(slotW * i), footerY);
      ctx.lineTo(Math.round(slotW * i), size);
      ctx.stroke();
    }
  }

  // cook icons: placed in 3 fixed slots (1:1 look). If fewer, fill from left (like typical reference).
  const cooks = getSelectedCooks();
  const slotW = leftW / 3;

  const iconSize = Math.round(size * 0.12);
  const iconY = footerY + Math.round((footerH - iconSize) / 2);

  for (let i = 0; i < cooks.length; i++) {
    const key = cooks[i];
    const img = await getIconImage("cook", key);

    const cx = Math.round(slotW * i + (slotW - iconSize) / 2);
    ctx.drawImage(img, cx, iconY, iconSize, iconSize);
  }

  // Weight text
  const wText = (weightText.value || "x kg").trim();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.round(size * 0.085)}px Ubuntu, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(wText, leftW + weightW / 2, footerY + footerH / 2);

  // Enable download if there's at least a render
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
  a.href = canvas.toDataURL("image/png");
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

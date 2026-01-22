// Hero Builder — Canvas render
// - Fondo: imagen subida
// - Header: ícono + texto (Ubuntu)
// - Footer: barra azul con íconos de cocción + bloque "x kg" a la derecha
// Export: PNG

const el = (id) => document.getElementById(id);

const canvas = el("canvas");
const ctx = canvas.getContext("2d");

const fileImage = el("fileImage");
const titleText = el("titleText");
const animalSelect = el("animalSelect");
const weightText = el("weightText");
const sizeSelect = el("sizeSelect");
const brandBlue = el("brandBlue");
const safeMargin = el("safeMargin");

const btnRender = el("btnRender");
const btnDownload = el("btnDownload");

let baseImg = null;

// ---------- SVG ICONS (simple line icons, white) ----------
function svgToImage(svgString) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

const ICONS = {
  // Animal icons in a rounded square tile (like your example)
  cow: `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect x="6" y="6" width="84" height="84" rx="14" fill="white"/>
  <g fill="none" stroke="#0B3A8F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M25 42c-4-7-1-16 9-18"/>
    <path d="M71 42c4-7 1-16-9-18"/>
    <path d="M33 37c4-6 9-9 15-9s11 3 15 9"/>
    <path d="M28 52c0-9 9-15 20-15s20 6 20 15v9c0 12-9 20-20 20s-20-8-20-20z"/>
    <path d="M41 62h14"/>
    <path d="M39 70c3 3 6 4 9 4s6-1 9-4"/>
    <circle cx="39" cy="57" r="1.5"/>
    <circle cx="57" cy="57" r="1.5"/>
  </g>
</svg>`,

  pig: `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect x="6" y="6" width="84" height="84" rx="14" fill="white"/>
  <g fill="none" stroke="#0B3A8F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M34 34c-4-3-10-3-14 2"/>
    <path d="M62 34c4-3 10-3 14 2"/>
    <path d="M28 49c0-12 9-20 20-20s20 8 20 20v10c0 12-9 20-20 20s-20-8-20-20z"/>
    <path d="M38 58c0-2 2-4 4-4h12c2 0 4 2 4 4v6c0 2-2 4-4 4H42c-2 0-4-2-4-4z"/>
    <circle cx="44" cy="61" r="1.5"/>
    <circle cx="52" cy="61" r="1.5"/>
    <circle cx="39" cy="51" r="1.5"/>
    <circle cx="57" cy="51" r="1.5"/>
  </g>
</svg>`,

  chicken: `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect x="6" y="6" width="84" height="84" rx="14" fill="white"/>
  <g fill="none" stroke="#0B3A8F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M47 30c-3-6-10-6-12 0 6 0 6 6 0 6"/>
    <path d="M55 32c4-3 10 1 7 6-2 4-8 4-12 0"/>
    <path d="M30 55c0-12 9-21 20-21s20 9 20 21-9 21-20 21-20-9-20-21z"/>
    <path d="M50 54c4 0 7-3 7-7-4 2-8 2-14 0 0 4 3 7 7 7z"/>
    <path d="M46 75l-4 8"/>
    <path d="M54 75l4 8"/>
  </g>
</svg>`,

  fish: `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect x="6" y="6" width="84" height="84" rx="14" fill="white"/>
  <g fill="none" stroke="#0B3A8F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M25 52c10-14 28-19 46-10 7 3 12 7 16 10-4 3-9 7-16 10-18 9-36 4-46-10z"/>
    <path d="M25 52l-9-8 2 8-2 8z"/>
    <circle cx="58" cy="49" r="2"/>
    <path d="M45 47c4 2 4 8 0 10"/>
  </g>
</svg>`,

  lamb: `
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect x="6" y="6" width="84" height="84" rx="14" fill="white"/>
  <g fill="none" stroke="#0B3A8F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 39c-6-6-2-16 8-16"/>
    <path d="M64 39c6-6 2-16-8-16"/>
    <path d="M30 55c0-12 9-20 20-20s20 8 20 20v8c0 12-9 20-20 20s-20-8-20-20z"/>
    <path d="M39 58h18"/>
    <path d="M44 70c2 2 4 3 6 3s4-1 6-3"/>
  </g>
</svg>`
};

const COOK = {
  grill: `
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 38h40"/>
    <path d="M22 44h36"/>
    <path d="M24 50h32"/>
    <path d="M26 56h28"/>
    <path d="M26 62l-4 10"/>
    <path d="M54 62l4 10"/>
    <path d="M30 20c0 6-6 6-6 12"/>
    <path d="M40 18c0 6-6 6-6 12"/>
    <path d="M50 20c0 6-6 6-6 12"/>
  </g>
</svg>`,

  oven: `
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <rect x="18" y="18" width="44" height="50" rx="6"/>
    <path d="M18 30h44"/>
    <circle cx="28" cy="25" r="2"/>
    <circle cx="36" cy="25" r="2"/>
    <circle cx="44" cy="25" r="2"/>
    <path d="M28 48h24"/>
    <path d="M26 56c4-6 8-6 12 0 4 6 8 6 12 0"/>
  </g>
</svg>`,

  pot: `
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M26 30h28"/>
    <path d="M30 26h20"/>
    <path d="M22 34h36"/>
    <path d="M20 36v8c0 16 8 26 20 26s20-10 20-26v-8"/>
    <path d="M20 44h40"/>
    <path d="M16 40c-4 2-4 10 0 12"/>
    <path d="M64 40c4 2 4 10 0 12"/>
  </g>
</svg>`
};

// Preload icons into Image objects (for faster render)
let animalImgs = {};
let cookImgs = {};

async function preloadIcons(brand = "#0B3A8F") {
  // animal tile uses brand stroke; rebuild by replacing default color
  const makeAnimal = (svg) => svg.replaceAll("#0B3A8F", brand);

  const animalKeys

// Renders the PWA / home-screen PNG icons from the FaGraduationCap logo.
// Run with: node scripts/generate-icons.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FaGraduationCap } from "react-icons/fa6";
import sharp from "sharp";

const ACCENT = "#4f46e5";
const path = renderToStaticMarkup(createElement(FaGraduationCap)).match(
  / d="([^"]+)"/,
)[1];

// The glyph's viewBox is 640x512 with content spanning y 32..480.
function svg({ size, radius, logoWidth }) {
  const scale = logoWidth / 640;
  const tx = (size - logoWidth) / 2;
  const ty = (size - 448 * scale) / 2 - 32 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${ACCENT}"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})" fill="#ffffff"><path d="${path}"/></g>
</svg>`;
}

const icons = [
  // "any" purpose: rounded tile, like the favicon
  { file: "public/icons/icon-192.png", size: 192, radius: 42, logoWidth: 134 },
  { file: "public/icons/icon-512.png", size: 512, radius: 112, logoWidth: 358 },
  // maskable: full-bleed, logo inside the 80% safe zone
  {
    file: "public/icons/maskable-512.png",
    size: 512,
    radius: 0,
    logoWidth: 280,
  },
  // iOS rounds the corners itself
  { file: "app/apple-icon.png", size: 180, radius: 0, logoWidth: 118 },
];

mkdirSync("public/icons", { recursive: true });
for (const icon of icons) {
  const png = await sharp(Buffer.from(svg(icon)))
    .png()
    .toBuffer();
  writeFileSync(icon.file, png);
  console.log(`${icon.file} (${icon.size}x${icon.size})`);
}

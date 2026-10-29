// Генерирует PNG-иконки PWA из public/logo.svg: node scripts/icons.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile("public/logo.svg", "utf8");
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
// maskable: фон на весь квадрат, рисунок ужат в безопасную зону
const maskable = svg
  .replace('rx="116"', 'rx="0"')
  .replace(/(<g fill="none"[\s\S]*)(<\/svg>)/, '<g transform="translate(51.2 51.2) scale(0.8)">$1</g>$2');
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png");

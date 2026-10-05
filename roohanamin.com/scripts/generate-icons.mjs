import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="0" fill="#344d3d"/><path d="M142 324l82-98 70 42 76-116" fill="none" stroke="#f6f7f2" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/><path d="M311 152h59v59" fill="none" stroke="#c5d2a4" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/></svg>',
);
await mkdir("public/icons", { recursive: true });
for (const [name, size] of [
  ["icon-192", 192],
  ["icon-512", 512],
  ["icon-maskable", 512],
  ["apple-touch-icon", 180],
]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile("public/icons/" + name + ".png");
}

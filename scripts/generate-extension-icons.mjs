import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { resolve } from "node:path";

const iconSizes = [16, 32, 48, 128];
const outdir = resolve("extension/icons");

const colors = {
  transparent: [0, 0, 0, 0],
  background: [139, 149, 136, 255],
  foreground: [244, 239, 230, 255],
  sageShadow: [111, 123, 113, 255],
  clay: [195, 163, 146, 255],
  linen: [227, 208, 191, 255],
  mauve: [183, 166, 162, 255],
};

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

export async function generateExtensionIcons() {
  await mkdir(outdir, { recursive: true });
  await Promise.all(
    iconSizes.map(async (size) => {
      await writeFile(resolve(outdir, `icon-${size}.png`), createIconPng(size));
    }),
  );
}

function createIconPng(size) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      setPixel(pixels, size, x, y, colors.transparent);
    }
  }

  drawRoundedRect(pixels, size, size * 0.06, size * 0.06, size * 0.88, size * 0.88, size * 0.23, colors.background);

  const centerX = size * 0.44;
  const centerY = size * 0.42;
  const radius = size * 0.24;
  const stroke = Math.max(2, size * 0.075);
  drawLine(pixels, size, size * 0.6, size * 0.59, size * 0.79, size * 0.78, Math.max(2, size * 0.09), colors.foreground);
  drawFilledCircle(pixels, size, centerX, centerY, radius + stroke / 2, colors.background);
  drawCircleStroke(pixels, size, centerX, centerY, radius * 0.77, Math.max(1, size * 0.016), colors.sageShadow);
  drawCircleStroke(pixels, size, centerX, centerY, radius, stroke, colors.foreground);
  drawLine(pixels, size, size * 0.38, size * 0.4, size * 0.5, size * 0.35, Math.max(1, size * 0.032), colors.foreground);
  drawLine(pixels, size, size * 0.5, size * 0.35, size * 0.55, size * 0.49, Math.max(1, size * 0.032), colors.foreground);
  drawFilledCircle(pixels, size, size * 0.38, size * 0.4, Math.max(1, size * 0.055), colors.clay);
  drawFilledCircle(pixels, size, size * 0.5, size * 0.35, Math.max(1, size * 0.048), colors.linen);
  drawFilledCircle(pixels, size, size * 0.55, size * 0.49, Math.max(1, size * 0.055), colors.mauve);

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    raw.set(pixels.subarray(y * size * 4, (y + 1) * size * 4), rowStart + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", pngHeader(size, size)),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawRoundedRect(pixels, size, x, y, width, height, radius, color) {
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const dx = Math.max(x - (px + 0.5), 0, px + 0.5 - (x + width));
      const dy = Math.max(y - (py + 0.5), 0, py + 0.5 - (y + height));
      const cornerX = px + 0.5 < x + radius ? x + radius : px + 0.5 > x + width - radius ? x + width - radius : px + 0.5;
      const cornerY = py + 0.5 < y + radius ? y + radius : py + 0.5 > y + height - radius ? y + height - radius : py + 0.5;
      const inOuterBounds = dx === 0 && dy === 0;
      const inRoundedCorner = Math.hypot(px + 0.5 - cornerX, py + 0.5 - cornerY) <= radius;
      if (inOuterBounds && inRoundedCorner) {
        setPixel(pixels, size, px, py, color);
      }
    }
  }
}

function drawCircleStroke(pixels, size, cx, cy, radius, stroke, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (Math.abs(distance - radius) <= stroke / 2) {
        setPixel(pixels, size, x, y, color);
      }
    }
  }
}

function drawFilledCircle(pixels, size, cx, cy, radius, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= radius) {
        setPixel(pixels, size, x, y, color);
      }
    }
  }
}

function drawLine(pixels, size, x1, y1, x2, y2, stroke, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (distanceToSegment(x + 0.5, y + 0.5, x1, y1, x2, y2) <= stroke / 2) {
        setPixel(pixels, size, x, y, color);
      }
    }
  }
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return Math.hypot(px - (x1 + ratio * dx), py - (y1 + ratio * dy));
}

function setPixel(pixels, size, x, y, color) {
  const offset = (y * size + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function pngHeader(width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return header;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await generateExtensionIcons();
  console.log(`Generated extension icons in ${outdir}`);
}

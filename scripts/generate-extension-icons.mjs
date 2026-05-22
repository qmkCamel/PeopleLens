import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { resolve } from "node:path";

const iconSizes = [16, 32, 48, 128];
const outdir = resolve("extension/icons");

const colors = {
  background: [34, 71, 44, 255],
  foreground: [244, 246, 242, 255],
  accent: [220, 232, 221, 255],
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
      setPixel(pixels, size, x, y, colors.background);
    }
  }

  const center = size * 0.43;
  const radius = size * 0.23;
  const stroke = Math.max(2, size * 0.08);
  drawCircleStroke(pixels, size, center, center, radius, stroke, colors.foreground);
  drawLine(pixels, size, size * 0.6, size * 0.6, size * 0.82, size * 0.82, Math.max(2, size * 0.09), colors.foreground);
  drawFilledCircle(pixels, size, center, center, Math.max(2, size * 0.08), colors.accent);

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

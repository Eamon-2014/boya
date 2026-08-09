// Generate eye-open and eye-off PNG icons
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 48;

function crc32(buf) {
  if (!crc32.table) {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
    crc32.table = t;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = crc32.table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return ~crc;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPNG(rgbaPixels) {
  // rgbaPixels: Uint8Array, SIZE*SIZE*4 bytes
  const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
  const src = Buffer.from(rgbaPixels);
  for (let y = 0; y < SIZE; y++) {
    raw[y * (1 + SIZE * 4)] = 0;
    src.copy(raw, y * (1 + SIZE * 4) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }
  const compressed = zlib.deflateSync(raw);
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = compressed;
  const iend = Buffer.alloc(0);
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', iend)
  ]);
}

// ============ Draw functions ============
function newCanvas() {
  return new Uint8Array(SIZE * SIZE * 4); // all transparent
}

function px(c, x, y, r, g, b, a) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  c[i] = r; c[i+1] = g; c[i+2] = b; c[i+3] = a;
}

function circle(c, cx, cy, radius, r, g, b, a, filled) {
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(SIZE - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(SIZE - 1, Math.ceil(cy + radius));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx, dy = y - cy;
      const d2 = dx*dx + dy*dy;
      if (filled) {
        if (d2 <= r2) px(c, x, y, r, g, b, a);
      } else {
        // outline: pixels near the circle boundary
        const inner = (radius - 1.5) * (radius - 1.5);
        if (d2 <= r2 && d2 >= inner) px(c, x, y, r, g, b, a);
      }
    }
  }
}

function ellipse(c, cx, cy, rx, ry, r, g, b, a, filled) {
  const minX = Math.max(0, Math.floor(cx - rx - 1));
  const maxX = Math.min(SIZE - 1, Math.ceil(cx + rx + 1));
  const minY = Math.max(0, Math.floor(cy - ry - 1));
  const maxY = Math.min(SIZE - 1, Math.ceil(cy + ry + 1));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = nx*nx + ny*ny;
      if (filled) {
        if (d <= 1) px(c, x, y, r, g, b, a);
      } else {
        const inner = (rx - 1.5) * (rx - 1.5) / (rx * rx);
        if (d <= 1 && d >= inner) px(c, x, y, r, g, b, a);
      }
    }
  }
}

function line(c, x1, y1, x2, y2, r, g, b, a, thickness) {
  const t = thickness || 1;
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1, y = y1;
  while (true) {
    // Draw thick pixel
    for (let ty = -t; ty <= t; ty++)
      for (let tx = -t; tx <= t; tx++)
        if (tx*tx + ty*ty <= t*t)
          px(c, x + tx, y + ty, r, g, b, a);
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

// ============ Draw eye-open ============
function drawEyeOpen() {
  const c = newCanvas();
  // Eye outline (almond shape approximated with ellipse) - 蓝色加粗
  ellipse(c, 24, 24, 20, 12, 37, 99, 235, 255, false);
  // 加粗外圈：再画一圈稍小的
  ellipse(c, 24, 24, 19, 11, 37, 99, 235, 255, false);
  // Iris
  circle(c, 24, 24, 7, 37, 99, 235, 255, false);
  // Pupil
  circle(c, 24, 24, 3, 37, 99, 235, 255, true);
  return createPNG(c);
}

// ============ Draw eye-off ============
function drawEyeOff() {
  const c = newCanvas();
  // 完整眼睛（与 eye-open 完全一致）
  ellipse(c, 24, 24, 20, 12, 37, 99, 235, 255, false);
  ellipse(c, 24, 24, 19, 11, 37, 99, 235, 255, false);
  circle(c, 24, 24, 7, 37, 99, 235, 255, false);
  circle(c, 24, 24, 3, 37, 99, 235, 255, true);
  // Diagonal slash line - 与外轮廓同样粗细
  line(c, 8, 40, 40, 8, 37, 99, 235, 255, 1);
  return createPNG(c);
}

// ============ Save ============
const outDir = path.join(__dirname, '..', 'images', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const open = drawEyeOpen();
fs.writeFileSync(path.join(outDir, 'eye-open.png'), open);
console.log('eye-open.png:', open.length, 'bytes');

const off = drawEyeOff();
fs.writeFileSync(path.join(outDir, 'eye-off.png'), off);
console.log('eye-off.png:', off.length, 'bytes');

console.log('Done!');

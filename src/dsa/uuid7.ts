/**
 * Client-side RFC 9562 UUIDv7 Generator with monotonic sequence counter.
 * Matches Python implementation in backend/app/core/uuid7.py
 */

let lastMs = 0;
let seq = 0;

export function generateUUIDv7(): string {
  let ms = Date.now();
  if (ms > lastMs) {
    lastMs = ms;
    seq = Math.floor(Math.random() * 0x07ff);
  } else {
    seq = (seq + 1) & 0x0fff;
    ms = lastMs;
  }

  const msHex = ms.toString(16).padStart(12, '0');
  const ver = '7';
  const seqHex = seq.toString(16).padStart(3, '0');

  // Variant: 0b10xxxxxx
  const varByte = (0x80 | Math.floor(Math.random() * 0x3f)).toString(16).padStart(2, '0');
  
  let randomHex = '';
  for (let i = 0; i < 7; i++) {
    randomHex += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }

  const part1 = msHex.slice(0, 8);
  const part2 = msHex.slice(8, 12);
  const part3 = `${ver}${seqHex}`;
  const part4 = `${varByte}${randomHex.slice(0, 2)}`;
  const part5 = randomHex.slice(2);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

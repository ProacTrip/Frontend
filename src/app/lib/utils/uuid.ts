/**
 * Genera un UUID v7 (time-ordered).
 *
 * Formato: tttttttt-tttt-7rrr-vrrr-rrrrrrrrrrrr
 * - 48 bits de timestamp Unix en milisegundos (12 caracteres hex)
 * - Versión 7 en el nibble de versión
 * - Variant 10xx en el nibble de variant
 * - 74 bits aleatorios (crypto.getRandomValues)
 *
 * Sin dependencias npm. ~25 LOC.
 */
export function generateUUIDv7(): string {
  // Timestamp Unix en milisegundos (48 bits)
  const timestamp = Date.now();

  // 10 bytes aleatorios (80 bits) — necesitamos 74 bits aleatorios
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);

  // Construir los 16 bytes del UUID
  const bytes = new Uint8Array(16);

  // Timestamp: bytes 0-5 (48 bits, big-endian)
  bytes[0] = (timestamp >>> 40) & 0xff;
  bytes[1] = (timestamp >>> 32) & 0xff;
  bytes[2] = (timestamp >>> 24) & 0xff;
  bytes[3] = (timestamp >>> 16) & 0xff;
  bytes[4] = (timestamp >>> 8) & 0xff;
  bytes[5] = timestamp & 0xff;

  // Versión 7: bytes 6-7 con nibble de versión = 7
  bytes[6] = (randomBytes[0] & 0x0f) | 0x70; // 0x70 = 0111 0000 → version 7
  bytes[7] = randomBytes[1];

  // Variant 10xx: byte 8 con bits superiores = 10
  bytes[8] = (randomBytes[2] & 0x3f) | 0x80; // 0x80 = 1000 0000 → variant 10xx

  // Resto aleatorio: bytes 9-15
  bytes[9] = randomBytes[3];
  bytes[10] = randomBytes[4];
  bytes[11] = randomBytes[5];
  bytes[12] = randomBytes[6];
  bytes[13] = randomBytes[7];
  bytes[14] = randomBytes[8];
  bytes[15] = randomBytes[9];

  // Formatear como UUID string: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

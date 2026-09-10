import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain"]);
const invalidUrl = (message: string) => Object.assign(new Error(message), { status: 400 });

function isPrivateIpv4Octets(a: number, b: number, _c: number, _d: number) {
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

function parseIpv6Words(address: string): number[] | null {
  let lower = address.toLowerCase();
  if (lower.startsWith("[") && lower.endsWith("]")) lower = lower.slice(1, -1);
  const lastColon = lower.lastIndexOf(":");
  if (lastColon !== -1 && lower.slice(lastColon + 1).includes(".")) {
    const parts = lower.slice(lastColon + 1).split(".").map(Number);
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n) && n >= 0 && n <= 255)) {
      lower = `${lower.slice(0, lastColon)}:${((parts[0] << 8) | parts[1]).toString(16)}:${((parts[2] << 8) | parts[3]).toString(16)}`;
    }
  }
  const doubleColon = lower.indexOf("::");
  let words: number[] = [];
  if (doubleColon !== -1) {
    const left = lower.slice(0, doubleColon).split(":").filter(Boolean);
    const right = lower.slice(doubleColon + 2).split(":").filter(Boolean);
    const missing = 8 - (left.length + right.length);
    if (missing < 0) return null;
    words = [...left.map((x) => parseInt(x, 16)), ...Array(missing).fill(0), ...right.map((x) => parseInt(x, 16))];
  } else {
    words = lower.split(":").map((x) => parseInt(x, 16));
  }
  return words.length === 8 && !words.some(Number.isNaN) ? words : null;
}

export function isPrivateIp(address: string) {
  const normalized = address.replace(/^::ffff:/i, "").toLowerCase();
  const parts = normalized.split(".").map(Number);
  if (parts.length === 4 && parts.every((n) => !Number.isNaN(n) && n >= 0 && n <= 255)) {
    return isPrivateIpv4Octets(parts[0], parts[1], parts[2], parts[3]);
  }
  const words = parseIpv6Words(address);
  if (words) {
    if (words.slice(0, 7).every((w) => w === 0) && (words[7] === 0 || words[7] === 1)) return true;
    if (words.slice(0, 5).every((w) => w === 0) && (words[5] === 0 || words[5] === 0xffff)) {
      return isPrivateIpv4Octets(words[6] >> 8, words[6] & 0xff, words[7] >> 8, words[7] & 0xff);
    }
    if ((words[0] & 0xffc0) === 0xfe80 || (words[0] & 0xfe00) === 0xfc00 || (words[0] & 0xff00) === 0xff00) return true;
    if (words[0] === 0x2001 && words[1] === 0x0db8) return true;
  }
  return false;
}

export async function assertSafePublicUrl(input: unknown) {
  if (typeof input !== "string" || input.length > 2048) throw invalidUrl("URL inválida.");
  let url: URL;
  try { url = new URL(input); } catch { throw invalidUrl("URL inválida."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || BLOCKED_HOSTS.has(url.hostname.toLowerCase())) {
    throw invalidUrl("Somente URLs públicas HTTP/HTTPS são permitidas.");
  }
  const cleanHost = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(cleanHost) ? [{ address: cleanHost }] : await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw invalidUrl("Endereços locais ou privados não são permitidos.");
  return url;
}

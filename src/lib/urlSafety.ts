import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain"]);
const invalidUrl = (message: string) => Object.assign(new Error(message), { status: 400 });

function parseIp(address: string): { type: 4; octets: number[] } | { type: 6; words: number[] } | null {
  const clean = address.trim().toLowerCase();

  // Handle standard IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(clean)) {
    const parts = clean.split(".");
    // Support octal conversion if leading zeroes present (e.g., 0177.0.0.1)
    const octets = parts.map((p) => (p.startsWith("0") && p.length > 1 ? parseInt(p, 8) : parseInt(p, 10)));
    if (octets.every((o) => !Number.isNaN(o) && o >= 0 && o <= 255)) return { type: 4, octets };
  }

  // Handle IPv6
  const parts = clean.split("::");
  if (parts.length > 2) return null;

  let left = parts[0] ? parts[0].split(":") : [];
  let right = parts.length > 1 && parts[1] ? parts[1].split(":") : [];

  // Check if last segment is dotted-decimal IPv4 (e.g. ::ffff:127.0.0.1 or fe80::1.2.3.4)
  const lastSeg = right.length > 0 ? right[right.length - 1] : left[left.length - 1];
  if (lastSeg && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lastSeg)) {
    const ipv4Parts = lastSeg.split(".");
    const octets = ipv4Parts.map((p) => (p.startsWith("0") && p.length > 1 ? parseInt(p, 8) : parseInt(p, 10)));
    if (octets.every((o) => !Number.isNaN(o) && o >= 0 && o <= 255)) {
      const w6 = (octets[0] << 8) | octets[1];
      const w7 = (octets[2] << 8) | octets[3];
      if (right.length > 0) right[right.length - 1] = w6.toString(16) + ":" + w7.toString(16);
      else left[left.length - 1] = w6.toString(16) + ":" + w7.toString(16);
      left = left.join(":").split(":").filter(Boolean);
      right = right.join(":").split(":").filter(Boolean);
    }
  }

  const missing = 8 - (left.length + right.length);
  if (parts.length === 1 && missing !== 0) return null;
  if (parts.length === 2 && missing < 0) return null;

  const words = [
    ...left.map((w) => parseInt(w, 16)),
    ...Array(parts.length === 2 ? missing : 0).fill(0),
    ...right.map((w) => parseInt(w, 16)),
  ];

  if (words.length !== 8 || words.some((w) => Number.isNaN(w) || w < 0 || w > 0xffff)) return null;

  // ONLY if prefix is 0:0:0:0:0:ffff (mapped) or 0:0:0:0:0:0 (compat) do we treat it as IPv4
  const isMapped = words[0] === 0 && words[1] === 0 && words[2] === 0 && words[3] === 0 && words[4] === 0 && words[5] === 0xffff;
  const isCompat = words[0] === 0 && words[1] === 0 && words[2] === 0 && words[3] === 0 && words[4] === 0 && words[5] === 0;

  if (isMapped || isCompat) {
    const b1 = words[6] >> 8;
    const b2 = words[6] & 0xff;
    const b3 = words[7] >> 8;
    const b4 = words[7] & 0xff;
    return { type: 4, octets: [b1, b2, b3, b4] };
  }

  return { type: 6, words };
}

export function isPrivateIp(address: string) {
  const parsed = parseIp(address);
  // Fail secure: treat invalid/unparseable IP strings as blocked
  if (!parsed) return true;

  if (parsed.type === 4) {
    const [a, b] = parsed.octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }

  if (parsed.type === 6) {
    const [w0] = parsed.words;
    // :: (unspecified)
    if (parsed.words.every((w) => w === 0)) return true;
    // ::1 (loopback)
    if (parsed.words.slice(0, 7).every((w) => w === 0) && parsed.words[7] === 1) return true;
    // fe80::/10 (link-local)
    if ((w0 & 0xffc0) === 0xfe80) return true;
    // fc00::/7 (unique local fc00:: to fdff::)
    if ((w0 & 0xfe00) === 0xfc00) return true;
    // 2001:db8::/32 (documentation)
    if (w0 === 0x2001 && parsed.words[1] === 0x0db8) return true;
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
  const addresses = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw invalidUrl("Endereços locais ou privados não são permitidos.");
  return url;
}

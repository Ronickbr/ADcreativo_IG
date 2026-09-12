import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain"]);
const invalidUrl = (message: string) => Object.assign(new Error(message), { status: 400 });

function isPrivateIpv4(parts: number[]): boolean {
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return false;
  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function parseIpv6(ip: string): number[] | null {
  let address = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (address.includes(".")) {
    const lastColon = address.lastIndexOf(":");
    const ipv4Parts = address.slice(lastColon + 1).split(".").map(Number);
    if (ipv4Parts.length === 4 && ipv4Parts.every((p) => !Number.isNaN(p) && p >= 0 && p <= 255)) {
      const hex1 = ((ipv4Parts[0] << 8) | ipv4Parts[1]).toString(16);
      const hex2 = ((ipv4Parts[2] << 8) | ipv4Parts[3]).toString(16);
      address = `${address.slice(0, lastColon + 1)}${hex1}:${hex2}`;
    }
  }
  const split = address.split("::");
  if (split.length > 2) return null;
  const left = split[0] ? split[0].split(":") : [];
  const right = split.length === 2 && split[1] ? split[1].split(":") : [];
  const missing = 8 - (left.length + right.length);
  if (missing < 0) return null;
  const hextets = [...left, ...Array(missing).fill("0"), ...right].map((h) => parseInt(h || "0", 16));
  return hextets.length === 8 && hextets.every((h) => !Number.isNaN(h)) ? hextets : null;
}

export function isPrivateIp(address: string): boolean {
  const clean = address.trim().replace(/^\[|\]$/g, "");
  const ipv4Parts = clean.split(".").map(Number);
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => !Number.isNaN(p))) {
    return isPrivateIpv4(ipv4Parts);
  }
  const hextets = parseIpv6(clean);
  if (!hextets) return false;

  // IPv6 loopback (::1) and unspecified (::)
  if (hextets.every((val, idx) => (idx === 7 ? val === 1 || val === 0 : val === 0))) return true;

  // IPv4-mapped (::ffff:x.x.x.x) or IPv4-compatible (::x.x.x.x)
  const isMapped = hextets[0] === 0 && hextets[1] === 0 && hextets[2] === 0 && hextets[3] === 0 && hextets[4] === 0 && (hextets[5] === 0xffff || hextets[5] === 0);
  if (isMapped) {
    const parts = [(hextets[6] >> 8) & 0xff, hextets[6] & 0xff, (hextets[7] >> 8) & 0xff, hextets[7] & 0xff];
    return isPrivateIpv4(parts);
  }

  const top16 = hextets[0];
  // Unique Local (fc00::/7), Link-Local (fe80::/10), Site-Local (fec0::/10), Multicast (ff00::/8)
  if ((top16 & 0xfe00) === 0xfc00 || (top16 & 0xffc0) === 0xfe80 || (top16 & 0xffc0) === 0xfec0 || (top16 & 0xff00) === 0xff00) return true;
  // Documentation range (2001:db8::/32)
  if (top16 === 0x2001 && hextets[1] === 0x0db8) return true;

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
  const addresses = isIP(cleanHost) ? [{ address: cleanHost }] : await lookup(cleanHost, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) throw invalidUrl("Endereços locais ou privados não são permitidos.");
  return url;
}

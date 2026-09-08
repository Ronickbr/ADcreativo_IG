import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain"]);
const invalidUrl = (message: string) => Object.assign(new Error(message), { status: 400 });

export function isPrivateIp(address: string) {
  const normalized = address.replace(/^::ffff:/, "").toLowerCase();
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  const parts = normalized.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
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

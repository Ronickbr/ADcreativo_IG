import test from "node:test";
import assert from "node:assert/strict";
import { isPrivateIp, assertSafePublicUrl } from "../src/lib/urlSafety.ts";

test("bloqueia faixas IPv4 privadas e reservadas", () => {
  for (const ip of ["127.0.0.1", "10.0.0.2", "172.16.10.1", "192.168.1.20", "169.254.2.1", "100.64.0.1"]) assert.equal(isPrivateIp(ip), true, ip);
});
test("permite IPv4 públicos", () => {
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("1.1.1.1"), false);
});
test("bloqueia IPv6 locais", () => {
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("0:0:0:0:0:0:0:1"), true);
  assert.equal(isPrivateIp("::ffff:7f00:1"), true);
  assert.equal(isPrivateIp("fd12::1"), true);
  assert.equal(isPrivateIp("fe80::1"), true);
  assert.equal(isPrivateIp("fec0::1"), true);
});
test("bloqueia URLs com IPv6 privado entre colchetes em assertSafePublicUrl", async () => {
  await assert.rejects(
    () => assertSafePublicUrl("http://[0:0:0:0:0:0:0:1]/"),
    /Endereços locais ou privados não são permitidos/
  );
  await assert.rejects(
    () => assertSafePublicUrl("http://[::ffff:7f00:1]/"),
    /Endereços locais ou privados não são permitidos/
  );
});

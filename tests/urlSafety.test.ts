import test from "node:test";
import assert from "node:assert/strict";
import { isPrivateIp } from "../src/lib/urlSafety.ts";

test("bloqueia faixas IPv4 privadas e reservadas", () => {
  for (const ip of ["127.0.0.1", "10.0.0.2", "172.16.10.1", "192.168.1.20", "169.254.2.1", "100.64.0.1", "0177.0.0.1"]) {
    assert.equal(isPrivateIp(ip), true, ip);
  }
});

test("permite IPv4 públicos", () => {
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("1.1.1.1"), false);
});

test("bloqueia IPv6 locais e mapeados IPv4 privados", () => {
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("fd12::1"), true);
  assert.equal(isPrivateIp("fe80::1"), true);
  assert.equal(isPrivateIp("fe80::8.8.8.8"), true);
  assert.equal(isPrivateIp("fc00::8.8.8.8"), true);
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true);
  assert.equal(isPrivateIp("0:0:0:0:0:ffff:127.0.0.1"), true);
  assert.equal(isPrivateIp("::ffff:7f00:1"), true);
  assert.equal(isPrivateIp("0000:0000:0000:0000:0000:ffff:7f00:0001"), true);
  assert.equal(isPrivateIp("::ffff:10.0.0.1"), true);
  assert.equal(isPrivateIp("::ffff:a00:1"), true);
  assert.equal(isPrivateIp("::ffff:192.168.1.1"), true);
});

test("permite IPv6/IPv4-mapeados públicos", () => {
  assert.equal(isPrivateIp("2001:4860:4860::8888"), false);
  assert.equal(isPrivateIp("::ffff:8.8.8.8"), false);
  assert.equal(isPrivateIp("::ffff:808:808"), false);
});

## 2025-05-18 - SSRF Bypass via IPv4-Mapped IPv6 Hex and Dotted Notation

**Vulnerability:**
The `isPrivateIp` helper in `src/lib/urlSafety.ts` allowed SSRF filter bypasses when private IPv4 addresses were provided as IPv4-mapped IPv6 addresses (e.g. `0:0:0:0:0:ffff:127.0.0.1` or `::ffff:7f00:1`) or octal IPv4 notations.

**Learning:**
Naive string parsing (such as stripping `^::ffff:` and checking for 4 dotted-decimal octets) fails to account for full IPv6 expanded forms, hexadecimal IPv4 representations inside IPv6, and octal IPv4 notation that system networking libraries resolve to loopback/private IPs.

**Prevention:**
Always expand and parse IPv6 addresses into full 16-bit word arrays to identify IPv4-mapped or IPv4-compatible prefixes (`0:0:0:0:0:ffff` or `0:0:0:0:0:0`) before evaluating private IP ranges. Convert IPv4 octets considering octal/hex representations.

## 2025-05-20 - SSRF IPv6 Bracketed Hostname Bypass
**Vulnerability:** Node.js `URL.hostname` preserves square brackets for IPv6 literals (e.g. `[::1]`). Passing bracketed hostnames to `net.isIP()` returns `0`, bypassing direct IP validation in SSRF safety checks.
**Learning:** `net.isIP()` expects IP address strings without square brackets. `URL.hostname` returns bracketed strings for IPv6 literals (`"[::1]"`).
**Prevention:** Always strip leading/trailing square brackets from `url.hostname` before evaluating `net.isIP()` or testing private IP range matches.

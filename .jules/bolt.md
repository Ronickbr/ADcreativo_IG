## 2025-05-18 - Express Rate Limiter Unbounded Map Memory Leak

**Learning:** Custom in-memory rate limiting middleware using a `Map<string, { count: number; reset: number }>` leaks memory over time if expired entries are not actively deleted. In environments with many unique client IP addresses, the Map size grows without bound, consuming server memory and increasing garbage collection overhead.

**Action:** Always prune expired entries when the rate-limiting Map reaches a threshold size.

## 2025-05-10 - Server-Side Request Forgery (SSRF) in Image Proxy and Scrape Endpoints
**Vulnerability:** Unrestricted URL fetching in `/api/proxy-image` and `/api/scrape` allowed arbitrary HTTP GET requests to internal network locations (localhost, 127.0.0.1, private IP ranges, cloud metadata services like 169.254.169.254).
**Learning:** Proxy and scraping endpoints that accept user-provided URLs without hostname/IP validation create high-severity SSRF vulnerabilities, potentially exposing internal services and cloud metadata.
**Prevention:** Always validate schemes (only allow `http:` and `https:`) and block private/loopback IP address ranges, localhost, and cloud metadata endpoints before issuing server-side HTTP requests.

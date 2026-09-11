# Bolt's Journal - Critical Learnings

## 2025-05-18 - Base64 vs Object URLs in React Image Previews
**Learning:** Storing raw Data URIs (Base64) in React state for image previews caused ~11MB string allocations per 8MB upload. Multiplying across 6 image inputs (products, background, logo), React VDOM diffing on input change re-evaluated ~66MB of string props on every keystroke. Using `URL.createObjectURL` reduces `preview` strings from ~11,000,000 characters to ~40 characters, drastically cutting DOM/state heap usage and eliminating VDOM prop diffing overhead.
**Action:** Always prefer `URL.createObjectURL(file)` for frontend image previews in React, and remember to revoke blob URLs (`URL.revokeObjectURL`) when images are removed or updated.

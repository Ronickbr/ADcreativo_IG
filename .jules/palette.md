## 2025-05-18 - Avoid Nested Interactive Buttons in Image Upload Components
**Learning:** Placing a delete/remove button (`<span onClick>` or `<button>`) inside an upload container `<button>` creates invalid HTML markup (nested interactive controls) and breaks keyboard navigation and screen reader focus order.
**Action:** Always wrap file upload dropzones in a relative container `<div>` and place overlay buttons (like "Remove image") as sibling `<button>` elements with distinct ARIA labels.

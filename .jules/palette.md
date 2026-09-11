## 2025-05-20 - Non-nested interactive targets in upload/preview components
**Learning:** Nesting interactive elements (e.g. a remove `span` with `onClick` inside a parent `<button>`) breaks HTML semantics and creates accessibility issues for screen readers and keyboard users.
**Action:** Always wrap preview/upload zones in a standard container `div`, using separate `<button>` elements with distinct `aria-label`s for actions like upload/change and remove.

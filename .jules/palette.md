## 2026-09-10 - HTML Button Nesting in Image Upload Components
**Learning:** React components representing image upload zones with a remove/delete action should avoid nesting `<button>` elements inside outer `<button>` components. Nesting buttons violates HTML specification and breaks keyboard navigation and screen reader accessibility.
**Action:** Use a relative container `<div>` with sibling `<button>` elements for upload and removal actions.

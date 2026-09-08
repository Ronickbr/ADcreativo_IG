# Bolt's Journal - Critical Learnings

## 2025-05-18 - Component Decomposition and Memoization in Single-File React Apps
**Learning:** In monolithic single-file React applications like `App.tsx`, updating nested object state (such as product name or price inputs) causes the entire root component to re-render, including all style selectors, settings modals, and result previews. Extracting list item inputs into `React.memo` sub-components prevents unnecessary VDOM diffing on every keystroke.
**Action:** Extract nested input state and list items into `React.memo` sub-components with stable callback references when profiling single-file React apps.

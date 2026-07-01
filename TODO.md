# Project Roadmap & Todo Tracking (`TODO.md`)

This document tracks upcoming architectural features, optimizations, and technical debt items for our dual-mode hybrid application framework.

---

## High-Priority Backlog

### 1. Global Reactive State Machine & Sub-App Inter-communication
*   **Description:** Implement an isolated, reactive state synchronization layer that allows decentralized sub-applications (`./src/apps/*`) to securely read and mutate shared global parameters (e.g., user profiles, authentication tokens, global notifications) and dispatch events across app boundaries back to the core shell layout framework.
*   **Target Scope:** `./src/lib/state/`
*   **Dependencies:** Complete lifecycle evaluation of sub-app isolation scopes.

### 2. Live Runtime Component Cache-Invalidation (Scenario 2 & 3 Fixes)
*   **Description:** Address the issue where modified `.vue` component files or missing entry points (stuck on blank views) require a hard application reload to reflect edits made via Termux. Implement a strategy (such as query-string cache busting or programmatic cache purging in router navigation guards) to allow sub-apps to refresh dynamically on entrance without forcing a total container reset.
*   **Target Scope:** `./src/sfcBootstrap.js` and `./src/router/index.js`
*   **Dependencies:** None (Current workaround is pressing `Ctrl + R` via the development keyboard listener).


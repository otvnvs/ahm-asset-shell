# Global Reactive State Engine & Inter-App Communication

This document outlines the architecture, data sync flow, and reactivity patterns used to share state variables between the main application shell and standalone, uncompiled applets (`./src/apps/*`) without utilizing global `window` variables.

---

## 1. Technical Framework: How It Works

Because the platform runs in an uncompiled mode, standard module imports can behave unexpectedly during page transitions due to file re-fetching. To achieve absolute stability, the architecture combines two specific patterns:

### Tier A: The Module Cache Singleton (The State Module)
When `vue3-sfc-loader` runs, it holds a unified in-memory dictionary called `moduleCache`. 
* When any component references `./src/lib/shell/state.js`, the loader fetches and compiles it **exactly once**.
* Every subsequent relative import to that file from *any* separate sub-application points back to that identical compiled instance in active device memory. This forms a natural data singleton.

### Tier B: Component Tree Provision (`Provide` / `Inject`)
To ensure that Vue’s internal rendering loop watches mutations perfectly across view unmounting cycles, the central state engine instance is bound to the root node tree inside `./src/Main.vue`:

```text
       ┌────────────────────────┐
       │       Main.vue         │ ───> Calls provide('globalState', state)
       └───────────┬────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│  Task Manager   │ │ System Monitor  │ ───> Calls inject('globalState')
│  (Mutates Data) │ │ (Renders Data)  │
└─────────────────┘ └─────────────────┘
```

By providing the state instance at the absolute root of the workspace, Vue passes a reactive reference straight down to all dynamically registered route entry views natively.

---

## 2. Structural Module Mappings

### 1. State Hub Blueprint (`./src/lib/shell/state.js`)
Manages system-wide data properties securely by separating mutable storage variables from public mutation wrappers:

*   **`state`**: A private, highly reactive object layer (`reactive()`) that maintains system tracking categories (like user details, background tasks, or general notification strings).
*   **`shellState.state`**: Exposed via a public javascript getter configured as `readonly()`. This allows external child applets to read properties safely while blocking malicious or unvalidated direct adjustments.
*   **`actions`**: The exclusive write-gateway. Child views must explicitly call methods inside this block (e.g., `setUserName(name)`) to commit valid state transformations.

---

## 3. Developer Implementation Blueprint (How to Connect a New Applet)

To hook up any newly created plug-and-play applet to the global shared memory space, use the following pattern:

### Step 1: Inject the Context Provider
Inside your app's raw `./src/apps/[your-app]/index.vue` file, omit physical file state imports and extract the parent context via Vue's native `inject` method:

```vue
<script setup>
import { inject } from 'vue'

// Injects the unified global state controller instance natively
const globalState = inject('globalState')
</script>
```

### Step 2: Read Global Variable Properties
Reference the readonly state wrapper directly inside your HTML template layout to ensure updates display dynamically:

```html
<template>
  <div class="card">
    <p>Logged in Profile: {{ globalState.state.user.name }}</p>
  </div>
</template>
```

### Step 3: Trigger State Mutations
To change a shared system variable, invoke the specific designated action callback wrapper inside your component logic:

```javascript
const handleProfileSave = (newName) => {
  // Dispatches the change cleanly up to the central engine
  globalState.actions.setUserName(newName)
}
```


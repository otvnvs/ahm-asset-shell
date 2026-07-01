# Standard Sample Application Layout Reference Template

This directory acts as the foundational structural blueprint for developing plug-and-play, zero-configuration micro-application modules compatible with this uncompiled hybrid runtime container platform.

## Folder Topology Design
To allow the automated runtime shell scanner engine to parse, map, and bundle your applet on-the-fly, follow this layout precisely:

```text
./src/apps/sample/
  ├── app.json        <── Application Metadata Manifest (Required)
  └── index.vue       <── Main Layout Structural Entry Component (Required)
```

## Manifest Baseline Specifications (`app.json`)
Keep your configuration definitions as lean as possible. Omit hardcoded absolute file system directory strings, entry node targets, or specific routing keys. The shell scanner computes these paths automatically based on your structural folder name:

```json
{
  "name": "Applet Display Name",
  "svgContent": "<path d=\"M12 2v20...\" ...></path>"
}
```

## Component Architecture Principles (`index.vue`)
*   **Encapsulated Styles:** Always mark your internal `<style>` parameters as `scoped`. This guarantees that your component styles stay isolated on your layout canvas and do not bleed onto the main dashboard framework.
*   **Shared Reactivity Injection:** Avoid referencing global window parameters or importing independent layout file models directly. To share data parameters securely across independent application modules, inject the application provider core context:
    ```javascript
    import { inject } from 'vue'
    const globalState = inject('globalState')
    // Read parameters: globalState.state.user.name
    // Mutate parameters: globalState.actions.setUserName('New Name')
    ```
*   **Shell Return Protocols:** To return the user smoothly back to the primary dashboard system, manage navigation via standard hash routing paths:
    ```javascript
    import { useRouter } from 'vue-router'
    const router = useRouter()
    const goHome = () => router.push('/home')
    ```


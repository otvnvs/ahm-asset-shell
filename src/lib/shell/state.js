import { reactive, readonly, computed } from 'vue';

// Private memory bucket handles compiler reference mapping
let activeCompilerReference = null;

// Private mutable state visible only inside this module's scope boundaries
const state = reactive({
  user: {
    name: 'Android Developer',
    role: 'Administrator'
  },
  activeApps: [],       // Tracks active processes running in background memory stacks
  installedApps: [],    // Tracks packages registered via the marketplace registry
  systemNotifications: [],
  sharedDataPool: {}    // Arbitrary key-value store for applet-to-applet variables
});

export const shellState = {
  // Readonly exposure to ensure sub-apps cannot mutate state directly without actions
  get state() {
    return readonly(state);
  },

  // State Mutation Action Handlers
  actions: {
    setUserName(name) {
      if (name && name.trim()) state.user.name = name.trim();
    },
    
    registerInstalledApp(appSummary) {
      if (!state.installedApps.some(a => a.id === appSummary.id)) {
        state.installedApps.push(appSummary);
      }
    },
    
    setSharedVariable(key, value) {
      state.sharedDataPool[key] = value;
    },

    pushNotification(message, type = 'info') {
      state.systemNotifications.push({
        id: Date.now(),
        text: message,
        type,
        timestamp: new Date().toLocaleTimeString()
      });
    },

    // Captures the high-speed boot compilation factory seamlessly
    registerCompilerFactory(compilerFn) {
      activeCompilerReference = compilerFn;
    },

    // Exposes a safe operational execution gateway to the child views
    compileComponentOnTheFly(filePath) {
      if (!activeCompilerReference) throw new Error('Shell compiler engine is currently uninitialized.');
      return activeCompilerReference(filePath);
    }
  },

  // Computed Derived State Mappings
  getters: {
    notificationCount: computed(() => state.systemNotifications.length),
    getSharedVariable: (key) => computed(() => state.sharedDataPool[key])
  }
};


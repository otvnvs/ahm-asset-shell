/**
 * Installs application-wide hardware keyboard event hooks.
 * Designed primarily to accelerate development iteration cycles.
 */
export function initKeyboardListeners() {
  window.addEventListener('keydown', (event) => {
    // Check for modifier keys: Control (Windows/Linux) or Meta (Mac Command Key)
    const isModifierPressed = event.ctrlKey || event.metaKey;
    
    // Intercept R key presses
    if (isModifierPressed && event.key.toLowerCase() === 'r') {
      event.preventDefault(); // Stop standard browser action
      console.log('Development Shortcut: Forcing application layer location refresh...');
      
      // Forces a total browser runtime document location reset
      window.location.reload();
    }
  });
}


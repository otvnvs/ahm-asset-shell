<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Spreadsheet Help</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <h3>Formulas</h3>
        <p>Always start your formulas with an equals sign (<code>=</code>).</p>
        
        <div class="example-group">
          <h4>Range Functions</h4>
          <ul>
            <li><code>=SUM(A1:A5)</code> - Adds numbers in the range</li>
            <li><code>=AVERAGE(A1:B3)</code> - Calculates the average</li>
            <li><code>=MIN(C1:C10)</code> - Finds the smallest number</li>
            <li><code>=MAX(A1:E15)</code> - Finds the largest number</li>
          </ul>
        </div>

        <div class="example-group">
          <h4>Basic Math</h4>
          <ul>
            <li><code>=A1+B1</code> - Simple addition</li>
            <li><code>=C2*1.15</code> - Multiplies by 1.15</li>
            <li><code>=(A1+A2)/B3</code> - Grouped math operations</li>
            <li><code>=B5-100</code> - Simple subtraction</li>
          </ul>
        </div>

        <h3>Gestures & Controls</h3>
        <ul>
          <li><strong>Navigation:</strong> Use your keyboard Arrow keys to move between cells.</li>
          <li><strong>Selection:</strong> Press / hold and drag across cells to highlight a block.</li>
          <li><strong>Autocomplete:</strong> Type <code>=S</code> or <code>=A</code> to trigger function auto-completion.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 15px;
}

.modal-content {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  width: 100%;
  max-width: 450px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

.modal-header {
  padding: 15px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.1rem;
  font-weight: 500;
  color: #bb86fc;
}

.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 15px;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #e0e0e0;
}

h3 {
  color: #bb86fc;
  font-size: 0.95rem;
  margin: 15px 0 5px 0;
}

h3:first-of-type {
  margin-top: 0;
}

h4 {
  color: #aaa;
  font-size: 0.85rem;
  margin: 8px 0 4px 0;
}

p {
  margin-bottom: 10px;
  color: #aaa;
}

code {
  background: #252525;
  padding: 2px 6px;
  border-radius: 4px;
  color: #81c784;
  font-family: monospace;
}

ul {
  padding-left: 15px;
  margin-bottom: 10px;
}

li {
  margin-bottom: 6px;
}

.example-group {
  background: #151515;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}
</style>


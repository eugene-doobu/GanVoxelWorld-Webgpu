const CSS = `
.inspector-toggle {
  position: fixed; top: 8px; right: 8px; z-index: 1001;
  width: 32px; height: 32px; border: none; border-radius: 4px;
  background: #383838; color: #ccc; font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: monospace;
}
.inspector-toggle:hover { background: #4a4a4a; }
.inspector-toggle.open { right: 328px; }

.inspector-panel {
  position: fixed; top: 0; right: 0; width: 320px; height: 100vh;
  background: #383838; color: #ddd; z-index: 1000;
  font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px;
  display: flex; flex-direction: column;
  box-shadow: -2px 0 8px rgba(0,0,0,0.4);
  overflow: hidden;
  transition: transform 0.2s ease;
}
.inspector-panel.hidden { transform: translateX(100%); pointer-events: none; }

.inspector-tab-bar {
  display: flex; background: #2d2d2d; border-bottom: 1px solid #555;
  flex-shrink: 0;
}
.inspector-tab-btn {
  flex: 1; padding: 8px 4px; border: none; background: transparent;
  color: #aaa; font-size: 11px; cursor: pointer;
  border-bottom: 2px solid transparent;
  font-family: inherit;
}
.inspector-tab-btn:hover { color: #ddd; background: #3a3a3a; }
.inspector-tab-btn.active { color: #fff; border-bottom-color: #5b9bd5; background: #383838; }

.inspector-tab-content {
  flex: 1; overflow-y: auto; padding: 4px 0;
}
.inspector-tab-content::-webkit-scrollbar { width: 6px; }
.inspector-tab-content::-webkit-scrollbar-track { background: #2d2d2d; }
.inspector-tab-content::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }

.inspector-section {
  margin: 2px 0;
}
.inspector-section-header {
  display: flex; align-items: center; padding: 5px 8px;
  background: #3a3a3a; cursor: pointer; user-select: none;
  border-top: 1px solid #444; border-bottom: 1px solid #333;
  font-weight: 600; font-size: 11px;
}
.inspector-section-header:hover { background: #424242; }
.inspector-section-arrow {
  display: inline-block; width: 12px; font-size: 8px; color: #888;
  transition: transform 0.15s ease; margin-right: 4px;
}
.inspector-section-header.collapsed .inspector-section-arrow { transform: rotate(-90deg); }
.inspector-section-body { padding: 4px 8px; }
.inspector-section-body.collapsed { display: none; }

.inspector-field {
  display: flex; align-items: center; margin: 3px 0; min-height: 22px;
}
.inspector-field-label {
  width: 40%; color: #bbb; font-size: 11px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  padding-right: 6px;
}
.inspector-field-control {
  width: 60%; display: flex; align-items: center; gap: 4px;
}
.inspector-field input[type="range"] {
  flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
  background: #555; border-radius: 2px; outline: none;
}
.inspector-field input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 12px; height: 12px;
  background: #8ab4f8; border-radius: 50%; cursor: pointer;
}
.inspector-field input[type="number"] {
  width: 60px; background: #2d2d2d; border: 1px solid #555;
  color: #ddd; padding: 2px 4px; border-radius: 3px; font-size: 11px;
  font-family: inherit;
}
.inspector-field input[type="checkbox"] {
  accent-color: #5b9bd5;
}
.inspector-field select {
  flex: 1; background: #2d2d2d; border: 1px solid #555;
  color: #ddd; padding: 2px 4px; border-radius: 3px; font-size: 11px;
  font-family: inherit;
}
.inspector-field .val-display {
  min-width: 36px; text-align: right; font-size: 11px; color: #8ab4f8;
  font-family: 'Consolas', monospace;
}

.inspector-btn {
  display: block; width: calc(100% - 16px); margin: 6px 8px;
  padding: 6px 12px; border: 1px solid #668; border-radius: 3px;
  background: #446; color: #fff; font-size: 12px; cursor: pointer;
  font-family: inherit;
}
.inspector-btn:hover { background: #558; }
.inspector-btn.dirty { background: #a65d00; border-color: #d48800; }

.inspector-subsection { margin-left: 8px; }
.inspector-subsection .inspector-section-header {
  font-weight: normal; font-size: 11px; padding: 3px 8px;
  background: #363636;
}

.inspector-field-error {
  animation: field-error-flash 0.8s ease;
}
@keyframes field-error-flash {
  0%, 100% { background: transparent; }
  20% { background: rgba(220, 50, 50, 0.35); }
  50% { background: rgba(220, 50, 50, 0.15); }
}
`;

let injected = false;

export function injectStyles(): void {
  if (injected) return;
  injected = true;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}

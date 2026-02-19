import { InspectorSection } from './InspectorSection';

export class InspectorTab {
  el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'inspector-tab-content';
    this.el.style.display = 'none';
  }

  addSection(title: string, collapsed = false): InspectorSection {
    const section = new InspectorSection(title, collapsed);
    this.el.appendChild(section.el);
    return section;
  }

  addButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'inspector-btn';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    this.el.appendChild(btn);
    return btn;
  }

  show(): void { this.el.style.display = ''; }
  hide(): void { this.el.style.display = 'none'; }
}

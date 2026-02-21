import { injectStyles } from './InspectorStyles';
import { InspectorTab } from './InspectorTab';

export class InspectorPanel {
  private panel: HTMLElement;
  private toggleBtn: HTMLElement;
  private tabBar: HTMLElement;
  private tabs = new Map<string, { btn: HTMLElement; tab: InspectorTab }>();
  private activeTab: string | null = null;
  private isOpen = false;

  private onToggleClick: () => void;
  private onF1KeyDown: (e: KeyboardEvent) => void;

  constructor() {
    injectStyles();

    this.onToggleClick = () => this.toggle();
    this.onF1KeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F1') {
        e.preventDefault();
        this.toggle();
      }
    };

    // Toggle button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'inspector-toggle';
    this.toggleBtn.textContent = '\u2699'; // gear icon
    this.toggleBtn.title = 'Settings (F1)';
    this.toggleBtn.addEventListener('click', this.onToggleClick);
    document.body.appendChild(this.toggleBtn);

    // Panel
    this.panel = document.createElement('div');
    this.panel.className = 'inspector-panel hidden';
    document.body.appendChild(this.panel);

    // Tab bar
    this.tabBar = document.createElement('div');
    this.tabBar.className = 'inspector-tab-bar';
    this.panel.appendChild(this.tabBar);

    // F1 shortcut
    document.addEventListener('keydown', this.onF1KeyDown);
  }

  destroy(): void {
    this.toggleBtn.removeEventListener('click', this.onToggleClick);
    document.removeEventListener('keydown', this.onF1KeyDown);
    this.toggleBtn.remove();
    this.panel.remove();
  }

  addTab(name: string, tab: InspectorTab): void {
    const btn = document.createElement('button');
    btn.className = 'inspector-tab-btn';
    btn.textContent = name;
    btn.addEventListener('click', () => this.selectTab(name));
    this.tabBar.appendChild(btn);
    this.panel.appendChild(tab.el);
    this.tabs.set(name, { btn, tab });

    // Select first tab
    if (this.tabs.size === 1) {
      this.selectTab(name);
    }
  }

  selectTab(name: string): void {
    if (this.activeTab === name) return;
    for (const [n, entry] of this.tabs) {
      if (n === name) {
        entry.btn.classList.add('active');
        entry.tab.show();
      } else {
        entry.btn.classList.remove('active');
        entry.tab.hide();
      }
    }
    this.activeTab = name;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.panel.classList.toggle('hidden', !this.isOpen);
    this.toggleBtn.classList.toggle('open', this.isOpen);
  }
}

import { createField, FieldOptions } from './InspectorField';

export class InspectorSection {
  el: HTMLElement;
  private body: HTMLElement;
  private header: HTMLElement;
  private isSubSection: boolean;

  constructor(title: string, collapsed = false, isSubSection = false) {
    this.isSubSection = isSubSection;

    this.el = document.createElement('div');
    this.el.className = isSubSection ? 'inspector-section inspector-subsection' : 'inspector-section';

    this.header = document.createElement('div');
    this.header.className = 'inspector-section-header' + (collapsed ? ' collapsed' : '');
    this.header.innerHTML = `<span class="inspector-section-arrow">\u25BC</span>${title}`;
    this.el.appendChild(this.header);

    this.body = document.createElement('div');
    this.body.className = 'inspector-section-body' + (collapsed ? ' collapsed' : '');
    this.el.appendChild(this.body);

    this.header.addEventListener('click', () => {
      const isCollapsed = this.header.classList.toggle('collapsed');
      this.body.classList.toggle('collapsed', isCollapsed);
    });
  }

  addField(opts: FieldOptions): HTMLElement {
    const field = createField(opts);
    this.body.appendChild(field);
    return field;
  }

  addSubSection(title: string, collapsed = true): InspectorSection {
    const sub = new InspectorSection(title, collapsed, true);
    this.body.appendChild(sub.el);
    return sub;
  }

  addElement(el: HTMLElement): void {
    this.body.appendChild(el);
  }
}

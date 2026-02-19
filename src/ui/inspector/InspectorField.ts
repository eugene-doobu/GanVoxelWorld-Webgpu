import { Config } from '../../config/Config';

export interface FieldOptions {
  type: 'slider' | 'number' | 'toggle' | 'dropdown';
  label: string;
  configPath: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
}

export function createField(opts: FieldOptions): HTMLElement {
  const row = document.createElement('div');
  row.className = 'inspector-field';

  const label = document.createElement('div');
  label.className = 'inspector-field-label';
  label.textContent = opts.label;
  label.title = opts.configPath;
  row.appendChild(label);

  const control = document.createElement('div');
  control.className = 'inspector-field-control';

  const currentValue = Config.get(opts.configPath);

  switch (opts.type) {
    case 'slider': {
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(opts.min ?? 0);
      input.max = String(opts.max ?? 100);
      input.step = String(opts.step ?? (opts.max != null && opts.max <= 1 ? 0.01 : 1));
      input.value = String(currentValue);

      const valSpan = document.createElement('span');
      valSpan.className = 'val-display';
      valSpan.textContent = formatVal(currentValue as number, opts.step);

      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        Config.set(opts.configPath, v);
        valSpan.textContent = formatVal(v, opts.step);
      });

      control.appendChild(input);
      control.appendChild(valSpan);
      break;
    }
    case 'number': {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = String(currentValue);
      if (opts.min != null) input.min = String(opts.min);
      if (opts.max != null) input.max = String(opts.max);
      if (opts.step != null) input.step = String(opts.step);

      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        if (!isNaN(v)) Config.set(opts.configPath, v);
      });

      control.appendChild(input);
      break;
    }
    case 'toggle': {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!currentValue;

      input.addEventListener('change', () => {
        Config.set(opts.configPath, input.checked);
      });

      control.appendChild(input);
      break;
    }
    case 'dropdown': {
      const select = document.createElement('select');
      for (const opt of (opts.options ?? [])) {
        const option = document.createElement('option');
        option.value = String(opt.value);
        option.textContent = opt.label;
        if (String(opt.value) === String(currentValue)) option.selected = true;
        select.appendChild(option);
      }

      select.addEventListener('change', () => {
        const v = isNaN(Number(select.value)) ? select.value : Number(select.value);
        Config.set(opts.configPath, v);
      });

      control.appendChild(select);
      break;
    }
  }

  row.appendChild(control);
  return row;
}

function formatVal(v: number, step?: number): string {
  if (step != null && step < 1) {
    const decimals = Math.max(1, Math.ceil(-Math.log10(step)));
    return v.toFixed(decimals);
  }
  if (v === Math.floor(v)) return String(v);
  return v.toFixed(2);
}

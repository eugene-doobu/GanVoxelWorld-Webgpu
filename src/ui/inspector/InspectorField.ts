import { Config, SetResult } from '../../config/Config';

export interface FieldOptions {
  type: 'slider' | 'number' | 'toggle' | 'dropdown';
  label: string;
  configPath: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
  /** Convert internal config value to display value */
  toDisplay?: (v: number) => number;
  /** Convert display value back to internal config value */
  fromDisplay?: (v: number) => number;
}

function showFieldError(row: HTMLElement, result: SetResult): void {
  if (result.success) return;
  console.warn(`[Config] ${result.error}`);
  row.classList.add('inspector-field-error');
  setTimeout(() => row.classList.remove('inspector-field-error'), 800);
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

  const rawValue = Config.get(opts.configPath);
  const toDisplay = opts.toDisplay ?? ((v: number) => v);
  const fromDisplay = opts.fromDisplay ?? ((v: number) => v);
  const currentValue = toDisplay(rawValue as number);

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
        const result = Config.set(opts.configPath, fromDisplay(v));
        if (result.success) {
          valSpan.textContent = formatVal(v, opts.step);
        } else {
          showFieldError(row, result);
        }
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
        if (!isNaN(v)) {
          const result = Config.set(opts.configPath, fromDisplay(v));
          showFieldError(row, result);
        }
      });

      control.appendChild(input);
      break;
    }
    case 'toggle': {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!currentValue;

      input.addEventListener('change', () => {
        const result = Config.set(opts.configPath, input.checked);
        showFieldError(row, result);
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
        const result = Config.set(opts.configPath, v);
        showFieldError(row, result);
      });

      control.appendChild(select);
      break;
    }
  }

  row.appendChild(control);
  return row;
}

// --- Custom (non-Config) field helpers ---

export interface CustomSliderResult {
  row: HTMLElement;
  slider: HTMLInputElement;
  display: HTMLSpanElement;
}

export function createCustomSlider(
  labelText: string, value: number,
  min: number, max: number, step: number,
  onInput: (v: number) => void,
): CustomSliderResult {
  const row = document.createElement('div');
  row.className = 'inspector-field';

  const label = document.createElement('div');
  label.className = 'inspector-field-label';
  label.textContent = labelText;
  row.appendChild(label);

  const control = document.createElement('div');
  control.className = 'inspector-field-control';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(value);

  const display = document.createElement('span');
  display.className = 'val-display';
  display.textContent = formatVal(value, step);

  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    display.textContent = formatVal(v, step);
    onInput(v);
  });

  control.appendChild(slider);
  control.appendChild(display);
  row.appendChild(control);
  return { row, slider, display };
}

export function createCustomToggle(
  labelText: string, checked: boolean,
  onChange: (v: boolean) => void,
): { row: HTMLElement; checkbox: HTMLInputElement } {
  const row = document.createElement('div');
  row.className = 'inspector-field';

  const label = document.createElement('div');
  label.className = 'inspector-field-label';
  label.textContent = labelText;
  row.appendChild(label);

  const control = document.createElement('div');
  control.className = 'inspector-field-control';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.addEventListener('change', () => onChange(checkbox.checked));

  control.appendChild(checkbox);
  row.appendChild(control);
  return { row, checkbox };
}

export function createCustomDropdown(
  labelText: string,
  options: { label: string; value: number | string }[],
  selected: number | string,
  onChange: (v: string) => void,
): { row: HTMLElement; select: HTMLSelectElement } {
  const row = document.createElement('div');
  row.className = 'inspector-field';

  const label = document.createElement('div');
  label.className = 'inspector-field-label';
  label.textContent = labelText;
  row.appendChild(label);

  const control = document.createElement('div');
  control.className = 'inspector-field-control';

  const select = document.createElement('select');
  for (const opt of options) {
    const option = document.createElement('option');
    option.value = String(opt.value);
    option.textContent = opt.label;
    if (String(opt.value) === String(selected)) option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener('change', () => onChange(select.value));

  control.appendChild(select);
  row.appendChild(control);
  return { row, select };
}

function formatVal(v: number, step?: number): string {
  if (step != null && step < 1) {
    const decimals = Math.max(1, Math.ceil(-Math.log10(step)));
    return v.toFixed(decimals);
  }
  if (v === Math.floor(v)) return String(v);
  return v.toFixed(2);
}

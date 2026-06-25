import { Icon } from './Icon';

interface Props {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxRow({ id, label, description, checked, onChange }: Props) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 py-[10px] px-[14px] rounded-[9px] cursor-pointer transition-all border-[1.5px] ${
        checked ? 'border-olive-700 bg-row-selected' : 'border-rule bg-white'
      }`}
    >
      <span
        className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 border-2 transition-all ${
          checked ? 'bg-olive-700 border-olive-700' : 'bg-white border-empty-border'
        }`}
      >
        {checked && <Icon name="check" size={10} stroke={2.8} className="text-white" />}
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div>
        <p className="text-[13.5px] font-semibold text-ink">{label}</p>
        {description && (
          <p className="font-mono text-[10px] tracking-[.04em] text-faint mt-[1px]">
            {description}
          </p>
        )}
      </div>
    </label>
  );
}

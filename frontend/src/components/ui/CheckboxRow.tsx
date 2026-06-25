interface Props {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxRow({ id, label, description, checked, onChange }: Props) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer py-[6px]">
      <div>
        <p className="font-mono text-[13px] text-ink">{label}</p>
        {description && (
          <p className="font-mono text-[10px] tracking-[.04em] text-faint mt-[1px]">
            {description}
          </p>
        )}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative inline-flex shrink-0 w-[38px] h-[22px] rounded-full transition-colors duration-200 ${
          checked ? 'bg-olive-700' : 'bg-rule'
        }`}
      >
        <span
          className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`}
        />
      </span>
    </label>
  );
}

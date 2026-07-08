import { Icon } from '@ui/Icon';

interface Props {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: string;
}

export function CheckboxRow({ id, label, description, checked, onChange, icon }: Props) {
  const trackOffColor = icon ? 'bg-toggle-off' : 'bg-rule';
  const trackSize = icon ? 'top-[3px] left-[3px] w-[21px] h-[21px]' : 'top-[2px] w-[18px] h-[18px]';
  const thumbOffset = icon ? 'translate-x-0' : 'translate-x-[2px]';
  const thumbOffsetChecked = icon ? 'translate-x-[19px]' : 'translate-x-[18px]';

  return (
    <label
      htmlFor={id}
      className={
        icon
          ? 'flex items-center justify-between gap-4 cursor-pointer bg-empty-bg border border-hairline rounded-xl px-4 py-[13px]'
          : 'flex items-center gap-3 cursor-pointer py-[6px]'
      }
    >
      <div className={icon ? 'flex items-center gap-[13px]' : undefined}>
        {icon && (
          <div
            className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${
              checked
                ? 'bg-olive-700 border border-olive-800 text-olive-50'
                : 'bg-olive-100 border border-olive-200 text-olive-700'
            }`}
          >
            <Icon name={icon} size={20} stroke={1.6} />
          </div>
        )}
        <div>
          <p
            className={
              icon ? 'text-[13.5px] font-semibold text-ink' : 'font-mono text-[13px] text-ink'
            }
          >
            {label}
          </p>
          {description && (
            <p className="font-mono text-[10px] tracking-[.04em] text-faint mt-[1px]">
              {description}
            </p>
          )}
        </div>
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
        className={`relative inline-flex shrink-0 rounded-full transition-colors duration-200 ${
          icon ? 'w-[46px] h-[27px]' : 'w-[38px] h-[22px]'
        } ${checked ? 'bg-olive-700' : trackOffColor}`}
      >
        <span
          className={`absolute rounded-full bg-white shadow-sm transition-transform duration-200 ${trackSize} ${
            checked ? thumbOffsetChecked : thumbOffset
          }`}
        />
      </span>
    </label>
  );
}

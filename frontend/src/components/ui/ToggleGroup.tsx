interface Props {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  selectedClassName?: string;
}

export function ToggleGroup({
  options,
  value,
  onChange,
  selectedClassName = 'bg-olive-700 text-white border-olive-700',
}: Props) {
  return (
    <div className="flex gap-[7px]">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 p-2 rounded-[8px] border text-[13px] transition-colors ${
            value === opt
              ? `font-semibold ${selectedClassName}`
              : 'font-normal bg-paper text-muted border-rule hover:border-olive-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

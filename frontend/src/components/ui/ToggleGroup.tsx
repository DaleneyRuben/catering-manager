interface Props {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}

export function ToggleGroup({ options, value, onChange }: Props) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-2 px-3 rounded-md border text-[13px] font-medium transition-colors ${
            value === opt
              ? 'bg-olive-700 text-white border-olive-700'
              : 'bg-paper text-ink border-rule hover:border-olive-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

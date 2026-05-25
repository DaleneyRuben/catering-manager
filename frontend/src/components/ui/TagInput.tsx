import { inputCls } from './Field';
import { Icon } from './Icon';

export function TagInput({
  label,
  tags,
  input,
  setInput,
  onAdd,
  onRemove,
}: {
  label: string;
  tags: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-cream-2 border border-rule text-ink"
          >
            {t}
            <button
              type="button"
              aria-label={`Quitar ${t}`}
              onClick={() => onRemove(t)}
              className="text-muted hover:text-ink transition-colors"
            >
              <Icon name="x" size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Escribí y presioná Enter…"
          className={`flex-1 ${inputCls()}`}
        />
        <button
          type="button"
          aria-label="Agregar"
          onClick={onAdd}
          className="px-3 py-2 border border-rule rounded-md hover:bg-cream-2 transition-colors"
        >
          <Icon name="plus" size={14} />
        </button>
      </div>
    </div>
  );
}

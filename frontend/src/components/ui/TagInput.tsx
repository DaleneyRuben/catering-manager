import { inputCls } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';

export function TagInput({
  label,
  labelClassName = 'text-[11px] font-mono uppercase tracking-wider text-muted mb-2',
  placeholder = 'Escribe y presiona Enter…',
  emptyMessage = 'Sin restricciones agregadas todavía',
  tags,
  input,
  setInput,
  onAdd,
  onRemove,
  tagClassName = 'bg-cream-2 border-rule text-ink',
}: {
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  emptyMessage?: string;
  tags: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
  tagClassName?: string;
}) {
  return (
    <div>
      {label && <p className={labelClassName}>{label}</p>}
      <div className="flex gap-[10px] mb-[13px]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className={`flex-1 ${inputCls()}`}
        />
        <button
          type="button"
          aria-label="Agregar"
          onClick={onAdd}
          className="inline-flex items-center gap-[6px] bg-olive-700 text-olive-50 rounded-[9px] px-[15px] text-[13px] font-semibold whitespace-nowrap hover:bg-olive-800 transition-colors"
        >
          <Icon name="plus" size={14} stroke={2.2} />
          Agregar
        </button>
      </div>
      <div className="min-h-[80px] bg-empty-bg border-[1.5px] border-dashed border-empty-border rounded-[11px] p-[13px] flex flex-wrap content-start gap-[8px]">
        {tags.length > 0 ? (
          tags.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center gap-[8px] pl-[13px] pr-[9px] py-[5px] rounded-full text-[12.5px] font-semibold border h-fit ${tagClassName}`}
            >
              {t}
              <button
                type="button"
                aria-label={`Quitar ${t}`}
                onClick={() => onRemove(t)}
                className="flex hover:opacity-60 transition-opacity"
              >
                <Icon name="x" size={12} stroke={2.4} />
              </button>
            </span>
          ))
        ) : (
          <p className="flex-1 self-center text-center font-mono text-[12px] text-empty-text">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}

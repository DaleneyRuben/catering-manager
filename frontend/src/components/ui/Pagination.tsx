import { Icon } from '@ui/Icon';

const LIMIT_OPTIONS = [10, 25, 50];

interface Props {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({ page, total, limit, onChange, onLimitChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;

  const pages: (number | 'gap-left' | 'gap-right')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('gap-left');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1)
      pages.push(i);
    if (page < totalPages - 2) pages.push('gap-right');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-rule">
      <div className="flex items-center gap-3">
        <p className="text-[11.5px] font-mono text-muted">
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
        </p>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
          {LIMIT_OPTIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onLimitChange(o)}
              className={`px-[10px] py-[5px] rounded-[7px] font-semibold transition-colors ${
                o === limit ? 'bg-olive-100 text-olive-700' : 'hover:bg-cream-2'
              }`}
            >
              {o}
            </button>
          ))}
          <span className="ml-1 uppercase tracking-[.08em] opacity-80">por página</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Anterior"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-rule text-muted hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          <Icon name="arrow-left" size={14} />
        </button>

        {pages.map((p) =>
          p === 'gap-left' || p === 'gap-right' ? (
            <span
              key={p}
              className="w-8 h-8 flex items-center justify-center text-[12px] font-mono text-muted"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-label={`Página ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-[12px] font-mono transition-colors ${
                p === page
                  ? 'bg-olive-700 text-white'
                  : 'border border-rule text-ink-2 hover:bg-cream-2'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Siguiente"
          className="w-8 h-8 flex items-center justify-center rounded-md border border-rule text-muted hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </div>
  );
}

interface Props {
  restrictions: string[];
  highlightQuery?: string;
}

const MAX_CHIPS = 3;

const PILL_BASE =
  'inline-flex items-center text-[11px] font-semibold px-[9px] py-[3px] rounded-full border whitespace-nowrap shrink-0';
const PILL_DEFAULT = `${PILL_BASE} bg-warn-bg text-warn border-warn-border`;
const PILL_MATCH = `${PILL_BASE} bg-olive-100 text-olive-700 border-olive-200`;
const PILL_MORE = `${PILL_BASE} bg-cream-2 text-muted border-rule cursor-default`;

export function ClientRestrictionPills({ restrictions, highlightQuery = '' }: Props) {
  if (restrictions.length === 0) return <span className="text-faint">—</span>;

  const query = highlightQuery.trim().toLowerCase();

  // surface any allergy-search match first so it's never hidden behind +N
  const sorted = [...restrictions]
    .map((name) => ({ name, isMatch: query !== '' && name.toLowerCase().includes(query) }))
    .sort((a, b) => (b.isMatch ? 1 : 0) - (a.isMatch ? 1 : 0));

  const visible = sorted.slice(0, MAX_CHIPS);
  const overflow = sorted.slice(MAX_CHIPS);

  return (
    <div className="flex flex-nowrap items-center gap-[5px] max-w-[230px]">
      {visible.map((r) => (
        <span key={r.name} className={r.isMatch ? PILL_MATCH : PILL_DEFAULT}>
          {r.name}
        </span>
      ))}
      {overflow.length > 0 && (
        <span title={overflow.map((r) => r.name).join(', ')} className={PILL_MORE}>
          +{overflow.length}
        </span>
      )}
    </div>
  );
}

interface Props {
  restrictions: string[];
  highlightQuery?: string;
}

const PILL_BASE =
  'inline-flex items-center text-[11px] font-semibold px-[9px] py-[3px] rounded-full border';
const PILL_DEFAULT = `${PILL_BASE} bg-warn-bg text-warn border-warn-border`;
const PILL_MATCH = `${PILL_BASE} bg-olive-100 text-olive-700 border-olive-200`;

export function ClientRestrictionPills({ restrictions, highlightQuery = '' }: Props) {
  if (restrictions.length === 0) return <span className="text-faint">—</span>;

  const query = highlightQuery.trim().toLowerCase();

  return (
    <div className="flex flex-wrap gap-[5px] max-w-[200px]">
      {restrictions.map((r) => {
        const isMatch = query !== '' && r.toLowerCase().includes(query);
        return (
          <span key={r} className={isMatch ? PILL_MATCH : PILL_DEFAULT}>
            {r}
          </span>
        );
      })}
    </div>
  );
}

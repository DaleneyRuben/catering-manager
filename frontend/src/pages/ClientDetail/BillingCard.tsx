interface Props {
  nit: string | null;
  businessName: string | null;
}

export function BillingCard({ nit, businessName }: Props) {
  return (
    <div className="bg-paper border border-rule rounded-lg p-5">
      <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800 mb-3">
        Facturación
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800">NIT</p>
          <p className="font-mono text-[13px]">{nit || '—'}</p>
        </div>
        <div>
          <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800">
            Razón social
          </p>
          <p className="font-mono text-[13px] break-words">{businessName || '—'}</p>
        </div>
      </div>
    </div>
  );
}

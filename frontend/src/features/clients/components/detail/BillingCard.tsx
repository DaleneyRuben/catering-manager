import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';

interface Props {
  nit: string | null;
  businessName: string | null;
}

export function BillingCard({ nit, businessName }: Props) {
  return (
    <Card>
      <Label variant="section" className="mb-3">
        Facturación
      </Label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label variant="field">NIT</Label>
          <p className="font-mono text-[13px]">{nit || '—'}</p>
        </div>
        <div>
          <Label variant="field">Razón social</Label>
          <p className="text-[13.5px] break-words">{businessName || '—'}</p>
        </div>
      </div>
    </Card>
  );
}

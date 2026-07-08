import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { Label } from '@ui/Label';

interface Props {
  rangeLabel: string;
  deliveredCount: number;
  suspendedCount: number;
  onSuspend: () => void;
}

export function ContractSummaryCard({
  rangeLabel,
  deliveredCount,
  suspendedCount,
  onSuspend,
}: Props) {
  return (
    <Card>
      <Label variant="section" className="mb-1">
        Resumen del contrato
      </Label>
      <p className="font-mono text-[11px] text-faint tabular-nums">{rangeLabel}</p>

      <div className="flex items-center justify-between pt-[14px] pb-3 border-b border-cream-2 mt-3">
        <span className="text-[12.5px] text-muted">Entregas realizadas</span>
        <span className="font-serif text-[26px] font-semibold leading-none text-olive-700">
          {deliveredCount}
        </span>
      </div>
      <div className="flex items-center justify-between pt-3 pb-[18px]">
        <span className="text-[12.5px] text-muted">Días suspendidos</span>
        <span className="font-serif text-[26px] font-semibold leading-none text-danger">
          {suspendedCount}
        </span>
      </div>

      <Button onClick={onSuspend} leftIcon="calendar" className="w-full">
        Suspender días
      </Button>
    </Card>
  );
}

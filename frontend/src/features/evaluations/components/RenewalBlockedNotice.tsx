import { Button } from '@ui/Button';

interface Props {
  hasStartDate: boolean;
}

const HOVER_REASON = 'Ya hay una renovación registrada para este cliente.';
const DATED_NOTE =
  'Este cliente ya tiene una renovación registrada. No puedes registrar otra. Si hay que cambiarla, pide a administración que la elimine.';
const UNDATED_NOTE =
  'Este cliente ya tiene una renovación registrada, pendiente de fecha de inicio. Si hay que cambiarla, pide a administración que la elimine.';

// opacity is pinned because the button carries its own dead palette: the shared disabled fade
// would wash it out into something lighter than the design's grey
const DEAD_BUTTON_STYLE = { padding: '12px 20px', fontSize: '13.5px', gap: '8px', opacity: 1 };

// The nutritionist cannot clear a queued renewal — that action is the admin's. This card is her
// only explanation surface, so it keeps the action visible but dead and names the escalation path.
export function RenewalBlockedNotice({ hasStartDate }: Props) {
  return (
    <div className="flex flex-col items-start gap-[10px] mt-5">
      <Button
        variant="bare"
        disabled
        title={HOVER_REASON}
        leftIcon="refresh"
        className="font-semibold rounded-[9px] bg-disabled-solid-bg text-empty-text"
        style={DEAD_BUTTON_STYLE}
      >
        Renovar plan
      </Button>
      <p className="text-[12.5px] text-muted leading-[1.55] max-w-[56ch]">
        {hasStartDate ? DATED_NOTE : UNDATED_NOTE}
      </p>
    </div>
  );
}

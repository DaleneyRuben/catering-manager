import { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { addBusinessDays } from '@/utils/businessDays';
import { isWeekendStartDate } from '@/features/clients/utils/startDate';
import { formatDate } from '@/utils/format';
import type { Subscription, RenewalPayload } from '@/features/clients/types';
import type { Plan } from '@/features/plans/types';

export type StartMode = 'atEnd' | 'pick' | 'undefined';

interface Options {
  plans: Plan[];
  sub: Subscription | undefined;
  isReactivation: boolean;
  onRenew: (data: RenewalPayload) => Promise<Subscription>;
  onClose: () => void;
  showPaidToggle?: boolean;
}

export function useRenewalForm({
  plans,
  sub,
  isReactivation,
  onRenew,
  onClose,
  showPaidToggle,
}: Options) {
  const [newPlanId, setNewPlanId] = useState(sub?.planId ?? plans[0]?.id ?? '');
  const [durationStr, setDurationStr] = useState('20');
  // precio = the agreed total for this contract; the plan supplies only its starting value
  const [precioStr, setPrecioStr] = useState('');
  const [startMode, setStartMode] = useState<StartMode>(isReactivation ? 'pick' : 'atEnd');
  const [pickedDate, setPickedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // no default selection: the Evaluaciones renewal flow requires an explicit choice
  const [paid, setPaid] = useState<boolean | undefined>(undefined);

  const newPlan = plans.find((p) => p.id === newPlanId);

  // Reselecting the client's current plan restores what they pay today; any other plan starts
  // from that plan's own price for the admin to negotiate from.
  useEffect(() => {
    if (!newPlan) return;
    const defaultPrecio =
      newPlan.id === sub?.planId ? (sub?.price ?? newPlan.price) : newPlan.price;
    setPrecioStr(String(defaultPrecio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPlanId]);

  // Set initial precio on first render once plans load
  useEffect(() => {
    if (plans.length > 0 && precioStr === '' && newPlan) {
      setPrecioStr(
        String(newPlan.id === sub?.planId ? (sub?.price ?? newPlan.price) : newPlan.price),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length]);

  const duration = parseInt(durationStr, 10);
  const validDuration = !Number.isNaN(duration) && duration > 0 ? duration : null;
  const precioNum = precioStr !== '' ? Number(precioStr) : undefined;
  // Positive when the client pays less than the plan's quoted price, negative when a longer
  // contract costs more than it. Display only — the agreed total is what gets stored.
  const discount = newPlan && precioNum !== undefined ? newPlan.price - precioNum : 0;
  const total = precioNum ?? 0;

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  let newStart: string | null = null;
  if (startMode === 'atEnd' && sub?.contractEndDate) {
    // first delivery day strictly after current contract end
    newStart = addBusinessDays(sub.contractEndDate, 1);
  } else if (startMode === 'pick') {
    newStart = pickedDate || null;
  }
  // startMode === 'undefined' → newStart stays null

  const newEnd = newStart && validDuration ? addBusinessDays(newStart, validDuration - 1) : null; // duration - 1 because startDate counts as day 1

  const willBePaused = startMode === 'undefined';
  const pickedDateIsWeekend = startMode === 'pick' && isWeekendStartDate(pickedDate ?? '');
  const canConfirm =
    !!validDuration &&
    precioNum !== undefined &&
    (willBePaused || !!newStart) &&
    !pickedDateIsWeekend &&
    (!showPaidToggle || paid !== undefined);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsSaving(true);
    try {
      await onRenew({
        planId: newPlanId,
        contractDate: format(new Date(), 'yyyy-MM-dd'),
        startDate: newStart,
        duration: validDuration!,
        price: total,
        renewalType: isReactivation ? 'reactivation' : 'renewal',
        ...(showPaidToggle ? { paid } : {}),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  let confirmLabel = 'Renovar';
  if (isReactivation) confirmLabel = 'Reactivar';
  else if (willBePaused) confirmLabel = 'Crear pausado';

  let newContractPreview = 'Sin fecha de inicio seleccionada';
  if (willBePaused) newContractPreview = 'Inicio sin definir';
  else if (newStart) newContractPreview = `${formatDate(newStart)} → ${formatDate(newEnd)}`;

  let vigenciaText = '— completar los campos —';
  if (willBePaused) vigenciaText = 'pausado (sin fecha)';
  else if (newStart && validDuration)
    vigenciaText = `${formatDate(newStart)} → ${formatDate(newEnd)} (${validDuration} días hábiles)`;

  return {
    newPlanId,
    setNewPlanId,
    newPlan,
    durationStr,
    setDurationStr,
    precioStr,
    setPrecioStr,
    startMode,
    setStartMode,
    pickedDate,
    setPickedDate,
    isSaving,
    validDuration,
    precioNum,
    discount,
    total,
    tomorrow,
    newStart,
    newEnd,
    willBePaused,
    pickedDateIsWeekend,
    canConfirm,
    handleConfirm,
    confirmLabel,
    newContractPreview,
    vigenciaText,
    paid,
    setPaid,
  };
}

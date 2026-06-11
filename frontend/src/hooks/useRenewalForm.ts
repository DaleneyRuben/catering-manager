import { useState, useEffect } from 'react';
import { addDays, format, isWeekend, parseISO } from 'date-fns';
import { addBusinessDays } from '../utils/businessDays';
import { formatDate } from '../utils/format';
import type { Plan, Subscription } from '../types/client';

export type StartMode = 'atEnd' | 'pick' | 'undefined';

interface Options {
  plans: Plan[];
  sub: Subscription | undefined;
  isReactivation: boolean;
  onRenew: (data: {
    planId: string;
    contractDate: string;
    startDate?: string | null;
    duration: number;
    discount: number;
    renewalType: 'renewal' | 'reactivation';
  }) => Promise<void>;
  onClose: () => void;
}

export function useRenewalForm({ plans, sub, isReactivation, onRenew, onClose }: Options) {
  const [newPlanId, setNewPlanId] = useState(sub?.planId ?? plans[0]?.id ?? '');
  const [durationStr, setDurationStr] = useState('');
  // precio = what the client actually pays; discount = plan.price - precio (auto-calculated)
  const [precioStr, setPrecioStr] = useState('');
  const [startMode, setStartMode] = useState<StartMode>(isReactivation ? 'pick' : 'atEnd');
  const [pickedDate, setPickedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const newPlan = plans.find((p) => p.id === newPlanId);

  // When plan changes, reset precio to (plan.price - previous discount) for same plan, or plan.price for a new plan
  useEffect(() => {
    if (!newPlan) return;
    const defaultPrecio =
      newPlan.id === sub?.planId ? newPlan.price - (sub?.discount ?? 0) : newPlan.price;
    setPrecioStr(String(defaultPrecio));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPlanId]);

  // Set initial precio on first render once plans load
  useEffect(() => {
    if (plans.length > 0 && precioStr === '' && newPlan) {
      setPrecioStr(String(newPlan.price - (sub?.discount ?? 0)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length]);

  const duration = parseInt(durationStr, 10);
  const validDuration = !Number.isNaN(duration) && duration > 0 ? duration : null;
  const precioNum = precioStr !== '' ? Number(precioStr) : undefined;
  const discount = newPlan && precioNum !== undefined ? Math.max(0, newPlan.price - precioNum) : 0;
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
  const pickedDateIsWeekend =
    startMode === 'pick' && !!pickedDate && isWeekend(parseISO(pickedDate));
  const canConfirm =
    !!validDuration &&
    precioNum !== undefined &&
    (willBePaused || !!newStart) &&
    !pickedDateIsWeekend;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsSaving(true);
    try {
      await onRenew({
        planId: newPlanId,
        contractDate: format(new Date(), 'yyyy-MM-dd'),
        startDate: newStart,
        duration: validDuration!,
        discount,
        renewalType: isReactivation ? 'reactivation' : 'renewal',
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
  };
}

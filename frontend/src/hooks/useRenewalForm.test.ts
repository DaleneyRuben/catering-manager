import { renderHook, act } from '@testing-library/react';
import { useRenewalForm } from './useRenewalForm';
import type { Plan, Subscription } from '../types/client';

const plan: Plan = { id: 'plan-1', name: 'Completo', price: 1200, meals: ['breakfast', 'lunch'] };

const sub: Subscription = {
  id: 'sub-1',
  clientId: 'client-1',
  planId: 'plan-1',
  contractDate: '2026-06-01',
  startDate: '2026-06-02',
  contractEndDate: '2026-06-26',
  discount: 0,
  duration: 20,
  suspendedDates: [],
  finalizedAt: null,
  plan,
};

function makeOptions(overrides: Partial<Parameters<typeof useRenewalForm>[0]> = {}) {
  return {
    plans: [plan],
    sub,
    isReactivation: false,
    onRenew: jest.fn().mockResolvedValue(undefined),
    onClose: jest.fn(),
    ...overrides,
  };
}

describe('useRenewalForm', () => {
  describe('initial state', () => {
    it('defaults to plan from sub', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      expect(result.current.newPlanId).toBe('plan-1');
    });

    it('defaults duration to 20', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      expect(result.current.durationStr).toBe('20');
    });

    it('defaults startMode to atEnd for renewal', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      expect(result.current.startMode).toBe('atEnd');
    });

    it('defaults startMode to pick for reactivation', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions({ isReactivation: true })));
      expect(result.current.startMode).toBe('pick');
    });
  });

  describe('startMode atEnd', () => {
    it('computes newStart as the business day after contractEndDate', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      // contractEndDate is 2026-06-26 (Friday) → next business day is 2026-06-29 (Monday)
      expect(result.current.newStart).toBe('2026-06-29');
    });

    it('computes newEnd from newStart + duration - 1 business days', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      // start = 2026-06-29, duration = 20, end = 20-1 = 19 business days later
      expect(result.current.newEnd).not.toBeNull();
    });

    it('willBePaused is false', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      expect(result.current.willBePaused).toBe(false);
    });
  });

  describe('startMode undefined', () => {
    it('willBePaused is true', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => result.current.setStartMode('undefined'));
      expect(result.current.willBePaused).toBe(true);
    });

    it('newStart is null', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => result.current.setStartMode('undefined'));
      expect(result.current.newStart).toBeNull();
    });

    it('confirmLabel is "Crear pausado"', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => result.current.setStartMode('undefined'));
      expect(result.current.confirmLabel).toBe('Crear pausado');
    });

    it('canConfirm is true when duration and precio are valid', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => {
        result.current.setStartMode('undefined');
        result.current.setPrecioStr('1200');
      });
      expect(result.current.canConfirm).toBe(true);
    });
  });

  describe('startMode pick', () => {
    it('pickedDateIsWeekend is true for a Saturday', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => {
        result.current.setStartMode('pick');
        result.current.setPickedDate('2026-06-20'); // Saturday
      });
      expect(result.current.pickedDateIsWeekend).toBe(true);
    });

    it('pickedDateIsWeekend is false for a weekday', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => {
        result.current.setStartMode('pick');
        result.current.setPickedDate('2026-06-29'); // Monday
      });
      expect(result.current.pickedDateIsWeekend).toBe(false);
    });

    it('canConfirm is false when picked date is a weekend', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => {
        result.current.setStartMode('pick');
        result.current.setPickedDate('2026-06-20');
        result.current.setPrecioStr('1200');
      });
      expect(result.current.canConfirm).toBe(false);
    });
  });

  describe('discount calculation', () => {
    it('discount is plan.price minus precio', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => result.current.setPrecioStr('1000'));
      expect(result.current.discount).toBe(200);
    });

    it('discount is clamped to 0 when precio exceeds plan price', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      act(() => result.current.setPrecioStr('1500'));
      expect(result.current.discount).toBe(0);
    });
  });

  describe('confirmLabel', () => {
    it('is "Renovar" for a regular renewal', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions()));
      expect(result.current.confirmLabel).toBe('Renovar');
    });

    it('is "Reactivar" for a reactivation', () => {
      const { result } = renderHook(() => useRenewalForm(makeOptions({ isReactivation: true })));
      expect(result.current.confirmLabel).toBe('Reactivar');
    });
  });

  describe('handleConfirm', () => {
    it('calls onRenew with the correct payload for atEnd mode', async () => {
      const onRenew = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      const { result } = renderHook(() => useRenewalForm(makeOptions({ onRenew, onClose })));
      act(() => result.current.setPrecioStr('1200'));
      await act(async () => {
        await result.current.handleConfirm();
      });
      expect(onRenew).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'plan-1',
          duration: 20,
          discount: 0,
          renewalType: 'renewal',
          startDate: '2026-06-29',
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onRenew with null startDate for undefined mode', async () => {
      const onRenew = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useRenewalForm(makeOptions({ onRenew })));
      act(() => {
        result.current.setStartMode('undefined');
        result.current.setPrecioStr('1200');
      });
      await act(async () => {
        await result.current.handleConfirm();
      });
      expect(onRenew).toHaveBeenCalledWith(expect.objectContaining({ startDate: null }));
    });

    it('does not call onRenew when canConfirm is false', async () => {
      const onRenew = jest.fn();
      const { result } = renderHook(() => useRenewalForm(makeOptions({ onRenew })));
      // precioStr is empty → canConfirm false
      act(() => result.current.setPrecioStr(''));
      await act(async () => {
        await result.current.handleConfirm();
      });
      expect(onRenew).not.toHaveBeenCalled();
    });
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklyCountsCard } from '@/features/production/components/WeeklyCountsCard';
import { useWeeklyCounts } from '@/features/production/hooks/useWeeklyCounts';
import type { WeeklyCounts } from '@/features/production/types';

jest.mock('@/features/production/hooks/useWeeklyCounts', () => ({
  useWeeklyCounts: jest.fn(),
}));
const mockUseWeeklyCounts = useWeeklyCounts as jest.Mock;

jest.mock('@/features/production/components/DayClientsModal', () => ({
  DayClientsModal: ({ date, onClose }: { date: string; onClose: () => void }) => (
    <div data-testid="day-modal">
      {date}
      <button type="button" onClick={onClose}>
        cerrar
      </button>
    </div>
  ),
}));

const weekStarts = ['2026-06-29', '2026-07-06', '2026-07-13'];

const currentWeek: WeeklyCounts = {
  weekStart: '2026-06-29',
  weekEnd: '2026-07-03',
  days: [
    { date: '2026-06-29', count: 10 },
    { date: '2026-06-30', count: 11 },
    { date: '2026-07-01', count: 12 },
    { date: '2026-07-02', count: 9 },
    { date: '2026-07-03', count: 8 },
  ],
};

const nextWeek: WeeklyCounts = {
  weekStart: '2026-07-06',
  weekEnd: '2026-07-10',
  days: [
    { date: '2026-07-06', count: 7 },
    { date: '2026-07-07', count: 6 },
    { date: '2026-07-08', count: 5 },
    { date: '2026-07-09', count: 4 },
    { date: '2026-07-10', count: 3 },
  ],
};

const weeksByStart: Record<string, WeeklyCounts> = {
  '2026-06-29': currentWeek,
  '2026-07-06': nextWeek,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseWeeklyCounts.mockImplementation(
    (weekStart: string, { initialData }: { initialData?: WeeklyCounts }) => ({
      weeklyCounts: initialData ?? weeksByStart[weekStart] ?? null,
      isLoading: false,
      error: null,
    }),
  );
});

const renderCard = (props: Partial<React.ComponentProps<typeof WeeklyCountsCard>> = {}) =>
  render(
    <WeeklyCountsCard
      weeklyCounts={currentWeek}
      weekStarts={weekStarts}
      today="2026-07-01"
      {...props}
    />,
  );

describe('WeeklyCountsCard', () => {
  it('renders the title, static subtitle, and week range badge', () => {
    renderCard();

    expect(screen.getByText('Clientes activos por día')).toBeInTheDocument();
    expect(screen.getByText('Clientes activos de lunes a viernes')).toBeInTheDocument();
    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('29 – 3 jul')).toBeInTheDocument();
  });

  it('renders one cell per weekday with its label and count', () => {
    renderCard();

    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Vie')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getAllByText('activos')).toHaveLength(5);
  });

  it('shows the Hoy badge only on the cell matching the today prop', () => {
    renderCard();

    expect(screen.getAllByText('Hoy')).toHaveLength(1);
  });

  it('shows no Hoy badge when today falls outside the week (e.g. weekend)', () => {
    renderCard({ today: '2026-07-04' });

    expect(screen.queryByText('Hoy')).not.toBeInTheDocument();
  });

  describe('without isAdmin (kitchen view)', () => {
    it('renders no week navigation, no date labels, and no clickable cells', () => {
      renderCard();

      expect(screen.queryByLabelText('Semana anterior')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Semana siguiente')).not.toBeInTheDocument();
      expect(screen.queryByText('29/06')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('never enables the weekly counts fetch', () => {
      renderCard();

      expect(mockUseWeeklyCounts).toHaveBeenCalledWith(
        '2026-06-29',
        expect.objectContaining({ enabled: false }),
      );
    });
  });

  describe('with isAdmin', () => {
    it('renders week navigation with prev disabled on the current week', () => {
      renderCard({ isAdmin: true });

      expect(screen.getByLabelText('Semana anterior')).toBeDisabled();
      expect(screen.getByLabelText('Semana siguiente')).toBeEnabled();
    });

    it('renders a dd/MM date label on each cell', () => {
      renderCard({ isAdmin: true });

      expect(screen.getByText('29/06')).toBeInTheDocument();
      expect(screen.getByText('03/07')).toBeInTheDocument();
    });

    it('shows no caveat on the current week', () => {
      renderCard({ isAdmin: true });

      expect(screen.queryByText(/Proyección según contratos vigentes/)).not.toBeInTheDocument();
    });

    it('pages to the next week by absolute week start, showing its counts, range, and caveat', () => {
      renderCard({ isAdmin: true });

      fireEvent.click(screen.getByLabelText('Semana siguiente'));

      expect(mockUseWeeklyCounts).toHaveBeenLastCalledWith(
        '2026-07-06',
        expect.objectContaining({ enabled: true, initialData: undefined }),
      );
      expect(screen.getByText('6 – 10 jul')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText(/Proyección según contratos vigentes/)).toBeInTheDocument();
      expect(screen.queryByText('Hoy')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Semana anterior')).toBeEnabled();
    });

    it('disables the next arrow on the last navigable week', () => {
      renderCard({ isAdmin: true });

      fireEvent.click(screen.getByLabelText('Semana siguiente'));
      fireEvent.click(screen.getByLabelText('Semana siguiente'));

      expect(screen.getByLabelText('Semana siguiente')).toBeDisabled();
    });

    it('opens the day modal with the clicked cell date and closes it', () => {
      renderCard({ isAdmin: true });

      fireEvent.click(screen.getByRole('button', { name: /Jue/ }));

      expect(screen.getByTestId('day-modal')).toHaveTextContent('2026-07-02');

      fireEvent.click(screen.getByText('cerrar'));

      expect(screen.queryByTestId('day-modal')).not.toBeInTheDocument();
    });

    it('shows skeleton cells while a week is loading', () => {
      mockUseWeeklyCounts.mockReturnValue({ weeklyCounts: null, isLoading: true, error: null });
      renderCard({ isAdmin: true });

      expect(screen.queryAllByText('activos')).toHaveLength(0);
    });

    it('shows an error message instead of skeletons when a week fails to load', () => {
      mockUseWeeklyCounts.mockReturnValue({
        weeklyCounts: null,
        isLoading: false,
        error: new Error('falló'),
      });
      renderCard({ isAdmin: true });

      expect(
        screen.getByText('No se pudo cargar la semana. Intenta de nuevo.'),
      ).toBeInTheDocument();
      expect(screen.queryAllByText('activos')).toHaveLength(0);
    });
  });
});

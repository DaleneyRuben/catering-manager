import { render, screen } from '@testing-library/react';
import { OpenMonthPill } from '@/features/finance/components/OpenMonthPill';

describe('OpenMonthPill', () => {
  it('marks the month as still running', () => {
    render(<OpenMonthPill />);

    expect(screen.getByText('Mes en curso')).toBeInTheDocument();
  });

  // The pill exists to say the totals beside it are provisional, so it says exactly that on hover
  // rather than leaving the reader to infer it from two words.
  it('says why it is there', () => {
    render(<OpenMonthPill />);

    expect(screen.getByTitle('Los totales de este mes todavía pueden cambiar')).toBeInTheDocument();
  });
});

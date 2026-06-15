import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

const TABS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'plan', label: 'Plan' },
  { id: 'history', label: 'Historial' },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(<Tabs tabs={TABS} activeId="overview" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Resumen' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Historial' })).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', () => {
    render(<Tabs tabs={TABS} activeId="plan" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Plan' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with the clicked tab id', async () => {
    const onChange = jest.fn();
    render(<Tabs tabs={TABS} activeId="overview" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Plan' }));
    expect(onChange).toHaveBeenCalledWith('plan');
  });

  it('applies active text style to the active tab', () => {
    render(<Tabs tabs={TABS} activeId="overview" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Resumen' })).toHaveClass('text-ink');
    expect(screen.getByRole('tab', { name: 'Plan' })).toHaveClass('text-muted');
  });

  it('applies custom className to the tablist', () => {
    render(<Tabs tabs={TABS} activeId="overview" onChange={() => {}} className="mb-5" />);
    expect(screen.getByRole('tablist')).toHaveClass('mb-5');
  });
});

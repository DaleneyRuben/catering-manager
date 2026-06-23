import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Contenido</Card>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('applies the design card radius, border, and default padding', () => {
    render(<Card>Contenido</Card>);
    const el = screen.getByText('Contenido');
    expect(el).toHaveClass('rounded-[14px]', 'border-rule', 'bg-paper');
    expect(el).toHaveStyle({ padding: '22px 24px' });
  });

  it('merges extra className', () => {
    render(<Card className="col-span-7">Contenido</Card>);
    expect(screen.getByText('Contenido')).toHaveClass('col-span-7');
  });

  it('allows overriding the default padding', () => {
    render(<Card padding="26px 28px">Contenido</Card>);
    expect(screen.getByText('Contenido')).toHaveStyle({ padding: '26px 28px' });
  });
});

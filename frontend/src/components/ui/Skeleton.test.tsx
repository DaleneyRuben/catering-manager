import { render } from '@testing-library/react';
import { Skeleton } from '@ui/Skeleton';

describe('Skeleton', () => {
  it('renders a div', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies animate-pulse and base classes', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('animate-pulse');
    expect(el).toHaveClass('bg-cream-2');
    expect(el).toHaveClass('rounded');
  });

  it('merges custom className', () => {
    const { container } = render(<Skeleton className="w-32 h-4" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('w-32');
    expect(el).toHaveClass('h-4');
  });
});

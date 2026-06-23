import { render } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders an svg for a known icon name', () => {
    const { container } = render(<Icon name="dashboard" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies the given size as width and height', () => {
    const { container } = render(<Icon name="users" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('returns null for unknown icon names', () => {
    const { container } = render(<Icon name="nonexistent" />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders three stacked circles for more-vertical', () => {
    const { container } = render(<Icon name="more-vertical" />);
    expect(container.querySelectorAll('circle')).toHaveLength(3);
  });
});

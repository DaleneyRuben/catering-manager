import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckboxRow } from './CheckboxRow';

const baseProps = {
  id: 'test-check',
  label: 'Ensalada grande',
  checked: false,
  onChange: jest.fn(),
};

describe('CheckboxRow', () => {
  it('renders the label text', () => {
    render(<CheckboxRow {...baseProps} />);
    expect(screen.getByText('Ensalada grande')).toBeInTheDocument();
  });

  it('renders optional description when provided', () => {
    render(<CheckboxRow {...baseProps} description="DAR GRANDES en el reporte" />);
    expect(screen.getByText('DAR GRANDES en el reporte')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    const { container } = render(<CheckboxRow {...baseProps} />);
    expect(container.querySelector('p + p')).toBeNull();
  });

  it('calls onChange with true when unchecked row is clicked', async () => {
    const onChange = jest.fn();
    render(<CheckboxRow {...baseProps} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Ensalada grande'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checked row is clicked', async () => {
    const onChange = jest.fn();
    render(<CheckboxRow {...baseProps} checked onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Ensalada grande'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('applies selected border and background when checked', () => {
    render(<CheckboxRow {...baseProps} checked />);
    const label = screen.getByLabelText('Ensalada grande').closest('label')!;
    expect(label.className).toContain('border-olive-700');
    expect(label.className).toContain('bg-row-selected');
  });

  it('applies default border when unchecked', () => {
    render(<CheckboxRow {...baseProps} />);
    const label = screen.getByLabelText('Ensalada grande').closest('label')!;
    expect(label.className).toContain('border-rule');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckboxRow } from '@ui/CheckboxRow';

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
    render(<CheckboxRow {...baseProps} />);
    expect(screen.queryByRole('paragraph')).toBeNull();
  });

  it('calls onChange with true when unchecked toggle is clicked', async () => {
    const onChange = jest.fn();
    render(<CheckboxRow {...baseProps} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Ensalada grande'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checked toggle is clicked', async () => {
    const onChange = jest.fn();
    render(<CheckboxRow {...baseProps} checked onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Ensalada grande'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('applies olive background to track when checked', () => {
    const { container } = render(<CheckboxRow {...baseProps} checked />);
    const track = container.querySelector('span[aria-hidden]')!;
    expect(track.className).toContain('bg-olive-700');
  });

  it('applies rule background to track when unchecked', () => {
    const { container } = render(<CheckboxRow {...baseProps} />);
    const track = container.querySelector('span[aria-hidden]')!;
    expect(track.className).toContain('bg-rule');
  });

  it('translates thumb to the right when checked', () => {
    const { container } = render(<CheckboxRow {...baseProps} checked />);
    const thumb = container.querySelector('span[aria-hidden] span')!;
    expect(thumb.className).toContain('translate-x-[18px]');
  });

  it('translates thumb to the left when unchecked', () => {
    const { container } = render(<CheckboxRow {...baseProps} />);
    const thumb = container.querySelector('span[aria-hidden] span')!;
    expect(thumb.className).toContain('translate-x-[2px]');
  });

  it('does not render an icon tile by default', () => {
    const { container } = render(<CheckboxRow {...baseProps} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  describe('with an icon', () => {
    it('renders the icon tile', () => {
      const { container } = render(<CheckboxRow {...baseProps} icon="salad" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('uses the larger track size', () => {
      const { container } = render(<CheckboxRow {...baseProps} icon="salad" />);
      const track = container.querySelector('span[aria-hidden]')!;
      expect(track.className).toContain('w-[46px]');
      expect(track.className).toContain('h-[27px]');
    });

    it('uses the toggle-off color when unchecked', () => {
      const { container } = render(<CheckboxRow {...baseProps} icon="salad" />);
      const track = container.querySelector('span[aria-hidden]')!;
      expect(track.className).toContain('bg-toggle-off');
    });

    it('uses the olive-700 color when checked', () => {
      const { container } = render(<CheckboxRow {...baseProps} icon="salad" checked />);
      const track = container.querySelector('span[aria-hidden]')!;
      expect(track.className).toContain('bg-olive-700');
    });

    it('translates the larger thumb when checked', () => {
      const { container } = render(<CheckboxRow {...baseProps} icon="salad" checked />);
      const thumb = container.querySelector('span[aria-hidden] span')!;
      expect(thumb.className).toContain('translate-x-[19px]');
    });

    it('keeps the larger thumb at rest when unchecked', () => {
      const { container } = render(<CheckboxRow {...baseProps} icon="salad" />);
      const thumb = container.querySelector('span[aria-hidden] span')!;
      expect(thumb.className).toContain('translate-x-0');
    });
  });
});

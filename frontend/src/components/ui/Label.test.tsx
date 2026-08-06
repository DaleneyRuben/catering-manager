import { render, screen } from '@testing-library/react';
import { Label } from '@ui/Label';

describe('Label', () => {
  it('renders the section variant with mono font, muted color, and bold weight', () => {
    render(<Label variant="section">Contrato</Label>);
    const el = screen.getByText('Contrato');
    expect(el).toHaveClass('font-mono', 'text-muted', 'font-semibold', 'uppercase');
  });

  it('renders the field variant (default) with faint color and no mono font', () => {
    render(<Label>Firma</Label>);
    const el = screen.getByText('Firma');
    expect(el).toHaveClass('text-faint', 'uppercase');
    expect(el).not.toHaveClass('font-mono');
  });

  it('renders a real label bound to its control when given htmlFor', () => {
    render(
      <>
        <Label htmlFor="duration">Duración</Label>
        <input id="duration" defaultValue="20" />
      </>,
    );
    expect(screen.getByLabelText('Duración')).toHaveValue('20');
  });

  it('stays a paragraph when no control is named', () => {
    render(<Label>Total</Label>);
    expect(screen.getByText('Total').tagName).toBe('P');
  });

  it('merges extra className', () => {
    render(<Label className="mb-3">Facturación</Label>);
    expect(screen.getByText('Facturación')).toHaveClass('mb-3');
  });
});

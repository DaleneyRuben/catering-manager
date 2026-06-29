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

  it('merges extra className', () => {
    render(<Label className="mb-3">Facturación</Label>);
    expect(screen.getByText('Facturación')).toHaveClass('mb-3');
  });
});

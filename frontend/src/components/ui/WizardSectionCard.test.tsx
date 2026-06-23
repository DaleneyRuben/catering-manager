import { render, screen } from '@testing-library/react';
import { WizardSectionCard } from './WizardSectionCard';

describe('WizardSectionCard', () => {
  it('renders the title, icon, and children', () => {
    render(
      <WizardSectionCard
        icon="plan"
        iconBg="bg-olive-100"
        iconColor="text-olive-700"
        title="Elegir plan"
      >
        <p>Contenido</p>
      </WizardSectionCard>,
    );
    expect(screen.getByText('Elegir plan')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('renders an optional badge', () => {
    render(
      <WizardSectionCard
        icon="report"
        iconBg="bg-cream-2"
        iconColor="text-muted"
        title="Facturación"
        badge="opcional"
      >
        <p>Contenido</p>
      </WizardSectionCard>,
    );
    expect(screen.getByText('opcional')).toBeInTheDocument();
  });

  it('renders an optional description indented to align with the title', () => {
    render(
      <WizardSectionCard
        icon="alert"
        iconBg="bg-warn-bg"
        iconColor="text-warn"
        title="Alergias"
        description="Agregá lo que el cliente no puede consumir."
      >
        <p>Contenido</p>
      </WizardSectionCard>,
    );
    const desc = screen.getByText('Agregá lo que el cliente no puede consumir.');
    expect(desc).toHaveClass('ml-[38px]');
  });
});

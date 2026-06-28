import { render, screen } from '@testing-library/react';
import { ClientRestrictionPills } from './ClientRestrictionPills';

describe('ClientRestrictionPills', () => {
  it('renders a dash when there are no restrictions', () => {
    render(<ClientRestrictionPills restrictions={[]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders each restriction as a pill', () => {
    render(<ClientRestrictionPills restrictions={['Gluten', 'Maní']} />);
    expect(screen.getByText('Gluten')).toBeInTheDocument();
    expect(screen.getByText('Maní')).toBeInTheDocument();
  });

  it('does not highlight any pill when there is no search query', () => {
    render(<ClientRestrictionPills restrictions={['Maní']} />);
    expect(screen.getByText('Maní')).toHaveClass('bg-warn-bg');
  });

  it('highlights a pill matching the search query in green', () => {
    render(<ClientRestrictionPills restrictions={['Maní', 'Gluten']} highlightQuery="man" />);
    expect(screen.getByText('Maní')).toHaveClass('bg-olive-100');
    expect(screen.getByText('Gluten')).toHaveClass('bg-warn-bg');
  });

  it('matches case-insensitively', () => {
    render(<ClientRestrictionPills restrictions={['MANÍ']} highlightQuery="maní" />);
    expect(screen.getByText('MANÍ')).toHaveClass('bg-olive-100');
  });

  it('shows at most 3 pills and collapses the rest into a +N badge', () => {
    render(
      <ClientRestrictionPills restrictions={['Gluten', 'Maní', 'Lácteos', 'Huevo', 'Soya']} />,
    );
    expect(screen.getByText('Gluten')).toBeInTheDocument();
    expect(screen.getByText('Maní')).toBeInTheDocument();
    expect(screen.getByText('Lácteos')).toBeInTheDocument();
    expect(screen.queryByText('Huevo')).not.toBeInTheDocument();
    expect(screen.queryByText('Soya')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not show an overflow badge with exactly 3 restrictions', () => {
    render(<ClientRestrictionPills restrictions={['Gluten', 'Maní', 'Lácteos']} />);
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('lists the overflowing restriction names in the badge title', () => {
    render(
      <ClientRestrictionPills restrictions={['Gluten', 'Maní', 'Lácteos', 'Huevo', 'Soya']} />,
    );
    expect(screen.getByText('+2')).toHaveAttribute('title', 'Huevo, Soya');
  });

  it('sorts a matching restriction to the front so it is never hidden behind +N', () => {
    render(
      <ClientRestrictionPills
        restrictions={['Gluten', 'Lácteos', 'Huevo', 'Maní']}
        highlightQuery="maní"
      />,
    );
    expect(screen.getByText('Maní')).toBeInTheDocument();
    expect(screen.getByText('Maní')).toHaveClass('bg-olive-100');
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});

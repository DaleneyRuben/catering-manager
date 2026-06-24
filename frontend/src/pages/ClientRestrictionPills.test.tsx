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
});

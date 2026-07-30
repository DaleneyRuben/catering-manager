import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders the trigger', () => {
    render(
      <Tooltip content="Explicación">
        <button type="button">Renovar</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Renovar' })).toBeInTheDocument();
  });

  it('does not render the tooltip content until hovered', () => {
    render(
      <Tooltip content="Explicación">
        <button type="button">Renovar</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip content on mouse enter and hides it on mouse leave', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Explicación">
        <button type="button">Renovar</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Renovar' }).parentElement as HTMLElement;

    await user.hover(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Explicación');

    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip content on focus and hides it on blur, even when the trigger is disabled', () => {
    render(
      <Tooltip content="Explicación">
        <button type="button" disabled>
          Renovar
        </button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Renovar' }).parentElement as HTMLElement;

    // focus/blur don't bubble natively — React delegates onFocus/onBlur via focusin/focusout,
    // which do, so those are what a disabled descendant needs to fire to reach the wrapper.
    fireEvent.focusIn(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Explicación');

    fireEvent.focusOut(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('aligns to the end by default and can be centered', () => {
    const { rerender } = render(
      <Tooltip content="Explicación" align="end">
        <button type="button">Renovar</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Renovar' }).parentElement as HTMLElement;
    fireEvent.focusIn(trigger);
    expect(screen.getByRole('tooltip')).toHaveClass('right-0');

    rerender(
      <Tooltip content="Explicación" align="center">
        <button type="button">Renovar</button>
      </Tooltip>,
    );
    fireEvent.focusIn(trigger);
    expect(screen.getByRole('tooltip')).toHaveClass('left-1/2');
  });
});

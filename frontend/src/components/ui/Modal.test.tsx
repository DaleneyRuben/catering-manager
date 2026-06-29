import { render, screen } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders children inside a dialog', () => {
    render(
      <Modal onClose={jest.fn()}>
        <p>contenido</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('applies the design backdrop color, blur, and dialog radius/shadow', () => {
    render(
      <Modal onClose={jest.fn()}>
        <p>contenido</p>
      </Modal>,
    );
    const backdrop = screen.getByTestId('modal-backdrop');
    expect(backdrop.className).toContain('bg-modal-backdrop');
    expect(backdrop.className).toContain('backdrop-blur-[3px]');

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('rounded-[16px]');
    expect(dialog.className).toContain('shadow-[var(--shadow-dialog)]');
    expect(dialog.className).not.toContain('border');
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal onClose={onClose}>
        <p>contenido</p>
      </Modal>,
    );
    screen.getByTestId('modal-backdrop').click();
    expect(onClose).toHaveBeenCalled();
  });
});

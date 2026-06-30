import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-olive-700');
    expect(screen.getByRole('button')).toHaveClass('hover:bg-olive-800');
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Cancelar</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-muted');
    expect(screen.getByRole('button')).not.toHaveClass('border');
  });

  it('applies danger variant', () => {
    render(<Button variant="danger">Eliminar</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-danger', 'border-danger-border');
  });

  it('applies destructive variant', () => {
    render(<Button variant="destructive">Confirmar</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });

  it('applies alert variant', () => {
    render(<Button variant="alert">Finalizar</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-alert');
  });

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Volver</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-olive-600');
    expect(screen.getByRole('button')).not.toHaveClass('bg-olive-700');
    expect(screen.getByRole('button')).not.toHaveClass('border');
  });

  it('applies bare variant with no color, bg, or font-weight classes', () => {
    render(<Button variant="bare">Item</Button>);
    const btn = screen.getByRole('button');
    expect(btn).not.toHaveClass('text-muted');
    expect(btn).not.toHaveClass('bg-olive-700');
    expect(btn).not.toHaveClass('border');
    expect(btn).not.toHaveClass('font-semibold');
  });

  it('applies sm size', () => {
    render(<Button size="sm">Acción</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-2');
  });

  it('applies md size matching the design spec', () => {
    render(<Button>Agregar usuario</Button>);
    expect(screen.getByRole('button')).toHaveClass(
      'px-[20px]',
      'py-[12px]',
      'text-[13.5px]',
      'rounded-[9px]',
      'gap-[9px]',
    );
  });

  it('is disabled and shows spinner when loading', () => {
    render(<Button loading>Guardar</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Guardar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', async () => {
    const handler = jest.fn();
    render(<Button onClick={handler}>Guardar</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handler = jest.fn();
    render(
      <Button disabled onClick={handler}>
        Guardar
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('renders leftIcon when not loading', () => {
    render(<Button leftIcon="check">Guardar</Button>);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });

  it('hides leftIcon when loading', () => {
    render(
      <Button leftIcon="check" loading>
        Guardar
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn.querySelector('.animate-spin')).toBeInTheDocument();
    // spinner replaces icon
    expect(btn.querySelectorAll('svg')).toHaveLength(0);
  });

  it('forwards extra className', () => {
    render(<Button className="w-full">Guardar</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });
});

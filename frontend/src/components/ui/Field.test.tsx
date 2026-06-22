import { render, screen } from '@testing-library/react';
import { Field, inputCls } from './Field';

describe('Field', () => {
  it('renders the label and children', () => {
    render(
      <Field label="Usuario" htmlFor="username">
        <input id="username" />
      </Field>,
    );
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows the required marker', () => {
    render(
      <Field label="Usuario" htmlFor="username" required>
        <input id="username" />
      </Field>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows the error message', () => {
    render(
      <Field label="Usuario" htmlFor="username" error="Campo requerido">
        <input id="username" />
      </Field>,
    );
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });
});

describe('inputCls', () => {
  it('matches the design: white background, 9px radius, 14px font, 11/14 padding', () => {
    const cls = inputCls();
    expect(cls).toContain('bg-white');
    expect(cls).toContain('rounded-[9px]');
    expect(cls).toContain('text-[14px]');
    expect(cls).toContain('py-[11px]');
    expect(cls).toContain('px-[14px]');
  });

  it('shows the warn border when hasError is true', () => {
    expect(inputCls(true)).toContain('border-warn');
  });
});

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field, inputCls, selectCls } from '@/components/ui/Field';

const meta: Meta<typeof Field> = {
  component: Field,
  decorators: [
    (Story) => (
      <div className="w-80 p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field label="Nombre" htmlFor="nombre">
      <input id="nombre" className={inputCls()} placeholder="Ingresa tu nombre" />
    </Field>
  ),
};

export const Required: Story = {
  render: () => (
    <Field label="Email" htmlFor="email" required>
      <input id="email" type="email" className={inputCls()} placeholder="correo@ejemplo.com" />
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field label="Precio" htmlFor="precio" required error="Este campo es requerido">
      <input id="precio" type="number" className={inputCls(true)} />
    </Field>
  ),
};

export const WithSelect: Story = {
  render: () => (
    <Field label="Zona" htmlFor="zona">
      <select id="zona" className={selectCls()}>
        <option value="">Selecciona una zona</option>
        <option value="centro">Centro</option>
        <option value="sur">Sur</option>
      </select>
    </Field>
  ),
};

export const SelectWithError: Story = {
  render: () => (
    <Field label="Zona" htmlFor="zona-err" required error="Selecciona una opción">
      <select id="zona-err" className={selectCls(true)}>
        <option value="">Selecciona una zona</option>
        <option value="centro">Centro</option>
        <option value="sur">Sur</option>
      </select>
    </Field>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/Button';

const meta: Meta<typeof Button> = {
  component: Button,
  decorators: [
    (Story) => (
      <div className="flex flex-wrap gap-3 p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Variants: Story = {
  render: () => (
    <>
      <Button variant="primary" leftIcon="check">
        Guardar
      </Button>
      <Button variant="secondary">Cancelar</Button>
      <Button variant="danger">Eliminar</Button>
      <Button variant="destructive" leftIcon="x">
        Confirmar eliminación
      </Button>
      <Button variant="alert">Finalizar plan</Button>
    </>
  ),
};

export const Sizes: Story = {
  render: () => (
    <>
      <Button size="md" leftIcon="check">
        Tamaño normal
      </Button>
      <Button size="sm" leftIcon="check">
        Tamaño pequeño
      </Button>
    </>
  ),
};

export const Loading: Story = {
  render: () => (
    <>
      <Button variant="primary" loading>
        Guardando...
      </Button>
      <Button variant="destructive" loading>
        Eliminando...
      </Button>
    </>
  ),
};

export const Disabled: Story = {
  render: () => (
    <>
      <Button variant="primary" disabled leftIcon="check">
        Guardar
      </Button>
      <Button variant="secondary" disabled>
        Cancelar
      </Button>
    </>
  ),
};

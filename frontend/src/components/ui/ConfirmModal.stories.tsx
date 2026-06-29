import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConfirmModal } from '@ui/ConfirmModal';

const meta: Meta<typeof ConfirmModal> = {
  component: ConfirmModal,
};

export default meta;
type Story = StoryObj<typeof ConfirmModal>;

export const WithIcon: Story = {
  render: () => (
    <ConfirmModal
      title="Eliminar cliente"
      message="Esta acción no se puede deshacer. Se perderán todos los datos del cliente."
      confirmLabel="Eliminar"
      icon="trash"
      onClose={() => {}}
      onConfirm={async () => {}}
    />
  ),
};

export const WithoutIcon: Story = {
  render: () => (
    <ConfirmModal
      title="Finalizar plan"
      message="El plan se finalizará hoy. El cliente quedará inactivo."
      confirmLabel="Finalizar"
      onClose={() => {}}
      onConfirm={async () => {}}
    />
  ),
};

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

export const WithDetails: Story = {
  render: () => (
    <ConfirmModal
      title="Eliminar renovación"
      message="Se elimina el contrato del plan Hiperproteico. El plan vigente no cambia."
      details={
        <div className="rounded-[10px] border border-hairline bg-empty-bg px-3.5 py-[11px]">
          <p className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-empty-text mb-1.5">
            Renovación por eliminar
          </p>
          <p className="font-mono text-[11.5px] tabular-nums text-muted">
            Hiperproteico · 02/07/2026 → 29/07/2026 · 20 días hábiles
          </p>
        </div>
      }
      confirmLabel="Eliminar renovación"
      onClose={() => {}}
      onConfirm={async () => {}}
    />
  ),
};

export const PrimaryVariant: Story = {
  render: () => (
    <ConfirmModal
      title="Confirmar pago"
      message="¿Confirmas que el cliente pagó su suscripción? Pasará a aparecer en la tabla de Clientes."
      confirmLabel="Confirmar pago"
      icon="check"
      variant="primary"
      onClose={() => {}}
      onConfirm={async () => {}}
    />
  ),
};

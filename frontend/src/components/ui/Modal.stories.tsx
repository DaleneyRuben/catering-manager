import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from '@ui/Modal';

const meta: Meta<typeof Modal> = {
  component: Modal,
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => (
    <Modal onClose={() => {}}>
      <div className="p-6 w-80">
        <p className="font-semibold text-lg mb-2">Título del modal</p>
        <p className="text-sm text-muted">Contenido del modal.</p>
      </div>
    </Modal>
  ),
};

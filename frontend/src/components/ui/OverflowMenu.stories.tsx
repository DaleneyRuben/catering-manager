import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverflowMenu } from '@ui/OverflowMenu';

const meta: Meta<typeof OverflowMenu> = {
  component: OverflowMenu,
  decorators: [
    (Story) => (
      <div className="p-6 flex justify-end">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OverflowMenu>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Editar', icon: 'pencil', onClick: () => {} },
      { label: 'Duplicar', icon: 'copy', onClick: () => {} },
    ],
  },
};

export const WithDestructiveItem: Story = {
  args: {
    items: [
      { label: 'Editar', icon: 'pencil', onClick: () => {} },
      { label: 'Duplicar', icon: 'copy', onClick: () => {} },
      { label: 'Eliminar', icon: 'trash', variant: 'alert', onClick: () => {} },
    ],
  },
};

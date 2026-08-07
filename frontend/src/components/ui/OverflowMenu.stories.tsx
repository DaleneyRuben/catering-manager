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

// What a list row uses: no border, so repeating it on every row does not read as clutter.
export const Bare: Story = {
  args: {
    variant: 'bare',
    label: 'Acciones del gasto',
    items: [
      { label: 'Editar', icon: 'pencil', onClick: () => {} },
      { label: 'Duplicar con la fecha de hoy', icon: 'copy', onClick: () => {} },
      { label: 'Eliminar', icon: 'trash', variant: 'alert', onClick: () => {} },
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

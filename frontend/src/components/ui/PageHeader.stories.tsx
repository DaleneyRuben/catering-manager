import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageHeader } from '@ui/PageHeader';
import { Button } from '@ui/Button';

const meta: Meta<typeof PageHeader> = {
  component: PageHeader,
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const WithoutAction: Story = {
  args: { label: 'Gestión', title: 'Clientes' },
};

export const WithAction: Story = {
  args: {
    label: 'Gestión',
    title: 'Clientes',
    action: (
      <Button variant="primary" leftIcon="plus">
        Nuevo cliente
      </Button>
    ),
  },
};

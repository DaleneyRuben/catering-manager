import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/Button';
import { Tooltip } from '@ui/Tooltip';

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

// right-justified: an "end"-aligned tooltip opens leftward from the trigger's right edge, so the
// trigger needs room to its left — same reasoning as OverflowMenu's decorator.
export const OnDisabledButton: Story = {
  decorators: [
    (Story) => (
      <div className="p-16 flex justify-end">
        <Story />
      </div>
    ),
  ],
  args: {
    content: 'Renovar está inactivo: un cliente puede tener una sola renovación pendiente.',
    align: 'end',
    children: (
      <Button variant="secondary" disabled leftIcon="refresh">
        Renovar
      </Button>
    ),
  },
};

export const Centered: Story = {
  decorators: [
    (Story) => (
      <div className="p-16 flex justify-center">
        <Story />
      </div>
    ),
  ],
  args: {
    content: 'Se muestra centrado bajo el elemento.',
    align: 'center',
    children: (
      <Button variant="secondary" disabled leftIcon="refresh">
        Renovar
      </Button>
    ),
  },
};

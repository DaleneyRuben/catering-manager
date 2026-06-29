import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'UI/IconButton',
  component: IconButton,
  args: {
    icon: 'x',
    label: 'Cerrar',
    onClick: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Ghost: Story = {
  args: { className: 'p-1 text-faint hover:text-ink-2' },
};

export const Outlined: Story = {
  args: {
    className: 'w-[34px] h-[34px] border border-rule rounded-md bg-paper hover:bg-cream-2',
  },
};

export const CardAction: Story = {
  args: {
    icon: 'pencil',
    label: 'Editar plan',
    className:
      'w-[34px] h-[34px] rounded-lg text-plan-edit hover:bg-olive-100 hover:text-olive-700',
  },
};

export const Disabled: Story = {
  args: { className: 'p-1 text-faint hover:text-ink-2', disabled: true },
};

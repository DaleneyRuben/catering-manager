import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@ui/Skeleton';

const meta: Meta<typeof Skeleton> = {
  component: Skeleton,
  decorators: [
    (Story) => (
      <div className="p-6 w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Line: Story = { args: { className: 'h-4 w-48' } };
export const Block: Story = { args: { className: 'h-24 w-full' } };
export const Circle: Story = { args: { className: 'h-10 w-10 rounded-full' } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageLoader } from '@/components/ui/PageLoader';

const meta: Meta<typeof PageLoader> = {
  component: PageLoader,
};

export default meta;
type Story = StoryObj<typeof PageLoader>;

export const Default: Story = {};

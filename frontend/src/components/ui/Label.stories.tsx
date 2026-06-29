import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '@/components/ui/Label';

const meta: Meta<typeof Label> = {
  component: Label,
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-3 p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Variants: Story = {
  render: () => (
    <>
      <Label variant="section">Contrato</Label>
      <Label variant="field">Firma</Label>
    </>
  ),
};

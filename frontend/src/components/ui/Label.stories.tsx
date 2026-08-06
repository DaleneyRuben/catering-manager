import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '@ui/Label';

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

export const BoundToAControl: Story = {
  render: () => (
    <div>
      <Label htmlFor="duration" className="mb-1.5">
        Duración
      </Label>
      <input
        id="duration"
        defaultValue="20"
        className="border border-rule rounded-[9px] px-[14px] py-[11px] text-[14px]"
      />
    </div>
  ),
};

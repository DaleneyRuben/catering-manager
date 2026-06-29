import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleGroup } from '@ui/ToggleGroup';

const meta: Meta<typeof ToggleGroup> = {
  component: ToggleGroup,
  decorators: [
    (Story) => (
      <div className="p-6 w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

const DELIVERY_ZONES = ['Centro', 'Sur'] as const;
const START_OPTIONS = ['Con fecha', 'Sin fecha'] as const;

function DeliveryZoneDemo() {
  const [value, setValue] = useState('Centro');
  return <ToggleGroup options={DELIVERY_ZONES} value={value} onChange={setValue} />;
}

function StartModeDemo() {
  const [value, setValue] = useState('Con fecha');
  return <ToggleGroup options={START_OPTIONS} value={value} onChange={setValue} />;
}

export const TwoOptions: Story = { render: () => <DeliveryZoneDemo /> };
export const StartMode: Story = { render: () => <StartModeDemo /> };

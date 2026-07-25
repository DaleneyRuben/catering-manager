import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimePickerInput } from '@ui/TimePickerInput';

const meta: Meta<typeof TimePickerInput> = {
  component: TimePickerInput,
  decorators: [
    (Story) => (
      <div className="p-6 w-64">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TimePickerInput>;

function EmptyDemo() {
  const [value, setValue] = useState('');
  return <TimePickerInput value={value} onChange={setValue} />;
}

function WithValueDemo() {
  const [value, setValue] = useState('14:30');
  return <TimePickerInput value={value} onChange={setValue} />;
}

export const Empty: Story = { render: () => <EmptyDemo /> };
export const WithValue: Story = { render: () => <WithValueDemo /> };

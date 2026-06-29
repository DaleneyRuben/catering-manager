import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePickerInput } from '@ui/DatePickerInput';

const meta: Meta<typeof DatePickerInput> = {
  component: DatePickerInput,
  decorators: [
    (Story) => (
      <div className="p-6 w-64">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DatePickerInput>;

function EmptyDemo() {
  const [value, setValue] = useState('');
  return <DatePickerInput value={value} onChange={setValue} />;
}

function WithValueDemo() {
  const [value, setValue] = useState('2026-06-29');
  return <DatePickerInput value={value} onChange={setValue} />;
}

function WithErrorDemo() {
  const [value, setValue] = useState('');
  return <DatePickerInput value={value} onChange={setValue} hasError />;
}

export const Empty: Story = { render: () => <EmptyDemo /> };
export const WithValue: Story = { render: () => <WithValueDemo /> };
export const WithError: Story = { render: () => <WithErrorDemo /> };

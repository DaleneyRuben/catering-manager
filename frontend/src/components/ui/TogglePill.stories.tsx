import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TogglePill } from '@ui/TogglePill';

const meta: Meta<typeof TogglePill> = {
  component: TogglePill,
  decorators: [
    (Story) => (
      <div className="flex flex-wrap gap-2 p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TogglePill>;

const DISEASES = ['Diabetes', 'Hipertensión', 'Sobrepeso', 'Gastritis', 'Celíaco'];

function MultiSelectDemo() {
  const [selected, setSelected] = useState<string[]>(['Diabetes']);
  const toggle = (d: string) =>
    setSelected((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  return (
    <>
      {DISEASES.map((d) => (
        <TogglePill
          key={d}
          pressed={selected.includes(d)}
          onClick={() => toggle(d)}
          className="py-[7px] px-[15px] text-[13px]"
        >
          {d}
        </TogglePill>
      ))}
    </>
  );
}

export const Default: Story = { render: () => <MultiSelectDemo /> };

export const Unpressed: Story = {
  render: () => (
    <TogglePill pressed={false} onClick={() => {}} className="py-[7px] px-[15px] text-[13px]">
      Diabetes
    </TogglePill>
  ),
};

export const Pressed: Story = {
  render: () => (
    <TogglePill pressed onClick={() => {}} className="py-[7px] px-[15px] text-[13px]">
      Diabetes
    </TogglePill>
  ),
};

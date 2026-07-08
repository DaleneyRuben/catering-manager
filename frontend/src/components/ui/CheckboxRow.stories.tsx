import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxRow } from '@ui/CheckboxRow';

const meta: Meta<typeof CheckboxRow> = {
  component: CheckboxRow,
  decorators: [
    (Story) => (
      <div className="p-6 max-w-sm flex flex-col gap-3">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CheckboxRow>;

export const Unchecked: Story = {
  args: {
    id: 'salad-grande',
    label: 'Ensalada grande',
    description: 'DAR GRANDES en el reporte de cocina',
    checked: false,
    onChange: () => {},
  },
};

export const Checked: Story = {
  args: {
    id: 'salad-grande',
    label: 'Ensalada grande',
    description: 'DAR GRANDES en el reporte de cocina',
    checked: true,
    onChange: () => {},
  },
};

export const WithoutDescription: Story = {
  args: {
    id: 'salad-grande',
    label: 'Ensalada grande',
    checked: false,
    onChange: () => {},
  },
};

export const WithIcon: Story = {
  args: {
    id: 'salad-grande-icon',
    label: 'Ensalada grande',
    icon: 'salad',
    checked: false,
    onChange: () => {},
  },
};

export const WithIconChecked: Story = {
  args: {
    id: 'salad-grande-icon-checked',
    label: 'Ensalada grande',
    icon: 'salad',
    checked: true,
    onChange: () => {},
  },
};

function InteractiveDemo() {
  const [checked, setChecked] = useState(false);
  return (
    <CheckboxRow
      id="salad-grande-interactive"
      label="Ensalada grande"
      description="DAR GRANDES en el reporte de cocina"
      checked={checked}
      onChange={setChecked}
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};

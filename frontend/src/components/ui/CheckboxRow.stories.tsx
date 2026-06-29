import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxRow } from '@/components/ui/CheckboxRow';

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

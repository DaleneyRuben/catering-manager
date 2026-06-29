import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from '@ui/Tabs';

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  decorators: [
    (Story) => (
      <div className="p-6 w-[480px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const THREE_TABS = [
  { id: 'overview', label: 'Resumen' },
  { id: 'plan', label: 'Plan y Cobros' },
  { id: 'history', label: 'Historial' },
];

function ThreeTabsDemo() {
  const [active, setActive] = useState('overview');
  return <Tabs tabs={THREE_TABS} activeId={active} onChange={setActive} />;
}

const MANY_TABS = [
  { id: 'a', label: 'Resumen' },
  { id: 'b', label: 'Plan y Cobros' },
  { id: 'c', label: 'Historial' },
  { id: 'd', label: 'Suspensiones' },
  { id: 'e', label: 'Grupo de entrega' },
];

function ManyTabsDemo() {
  const [active, setActive] = useState('a');
  return <Tabs tabs={MANY_TABS} activeId={active} onChange={setActive} />;
}

export const Default: Story = { render: () => <ThreeTabsDemo /> };
export const ManyTabs: Story = { render: () => <ManyTabsDemo /> };

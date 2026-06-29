import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PlanRadioList } from '@/components/ui/PlanRadioList';
import type { Plan } from '@/features/clients/types';

const plans: Plan[] = [
  { id: '1', name: 'Almuerzo', price: 640, meals: ['lunch'] },
  { id: '2', name: 'Almuerzo y cena', price: 910, meals: ['lunch', 'dinner'] },
  {
    id: '3',
    name: 'Reductor',
    price: 1450,
    meals: ['breakfast', 'lunch', 'afternoon_snack', 'dinner', 'juice'],
  },
  {
    id: '4',
    name: 'Hiperproteico',
    price: 1550,
    meals: [
      'breakfast',
      'morning_snack',
      'salad',
      'lunch',
      'afternoon_snack',
      'dinner',
      'juice',
      'extra',
    ],
  },
];

function Demo({ size }: { size?: 'sm' | 'md' }) {
  const [selectedId, setSelectedId] = useState<string | undefined>('2');
  return (
    <PlanRadioList plans={plans} selectedId={selectedId} onSelect={setSelectedId} size={size} />
  );
}

const meta: Meta<typeof PlanRadioList> = {
  title: 'UI/PlanRadioList',
  component: PlanRadioList,
};
export default meta;

type Story = StoryObj<typeof PlanRadioList>;

export const Medium: Story = {
  render: () => <Demo size="md" />,
};

export const Small: Story = {
  render: () => <Demo size="sm" />,
};

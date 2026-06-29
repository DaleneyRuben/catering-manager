import type { Meta, StoryObj } from '@storybook/react-vite';
import { WizardSectionCard } from '@/components/ui/WizardSectionCard';

const meta: Meta<typeof WizardSectionCard> = {
  component: WizardSectionCard,
  decorators: [
    (Story) => (
      <div className="p-6 max-w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WizardSectionCard>;

export const Default: Story = {
  args: {
    icon: 'user-plus',
    iconBg: 'bg-olive-100',
    iconColor: 'text-olive-700',
    title: 'Identidad y contacto',
    children: <p className="text-[13px] text-muted">Campos del formulario van aquí.</p>,
  },
};

export const WithBadgeAndDescription: Story = {
  args: {
    icon: 'report',
    iconBg: 'bg-cream-2',
    iconColor: 'text-muted',
    title: 'Facturación',
    badge: 'opcional',
    description: 'NIT y razón social para emisión de factura.',
    children: <p className="text-[13px] text-muted">Campos del formulario van aquí.</p>,
  },
};

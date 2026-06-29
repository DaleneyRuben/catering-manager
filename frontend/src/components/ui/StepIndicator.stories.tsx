import type { Meta, StoryObj } from '@storybook/react-vite';
import { StepIndicator } from '@ui/StepIndicator';

const STEPS = ['Datos personales', 'Plan', 'Confirmación'];

const meta: Meta<typeof StepIndicator> = {
  component: StepIndicator,
  args: { steps: STEPS },
  decorators: [
    (Story) => (
      <div className="p-6 max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StepIndicator>;

export const Step1: Story = { args: { current: 1 } };
export const Step2: Story = { args: { current: 2 } };
export const Step3: Story = { args: { current: 3 } };

export const FourSteps: Story = {
  args: {
    steps: ['Información', 'Plan', 'Pagos', 'Confirmación'],
    current: 2,
  },
};

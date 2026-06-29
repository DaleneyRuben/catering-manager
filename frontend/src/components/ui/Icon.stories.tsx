import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@/components/ui/Icon';

const ICON_NAMES = [
  'dashboard',
  'users',
  'user-plus',
  'plan',
  'menu',
  'chef',
  'report',
  'refresh',
  'alert',
  'check',
  'x',
  'plus',
  'arrow-right',
  'arrow-left',
  'arrow-up',
  'phone',
  'pin',
  'calendar',
  'search',
  'filter',
  'download',
  'upload',
  'print',
  'allergy',
  'stethoscope',
  'settings',
  'leaf',
  'chevron-down',
];

const meta: Meta<typeof Icon> = {
  component: Icon,
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: { type: 'range', min: 12, max: 48, step: 2 } },
    stroke: { control: { type: 'range', min: 1, max: 3, step: 0.5 } },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Single: Story = {
  args: { name: 'dashboard', size: 24 },
};

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-7 gap-6 p-6">
      {ICON_NAMES.map((name) => (
        <div key={name} className="flex flex-col items-center gap-1.5">
          <Icon name={name} size={24} />
          <span className="text-[10px] font-mono text-muted text-center">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 p-6">
      {[12, 16, 20, 24, 32, 40].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Icon name="plan" size={size} />
          <span className="text-[10px] font-mono text-muted">{size}px</span>
        </div>
      ))}
    </div>
  ),
};

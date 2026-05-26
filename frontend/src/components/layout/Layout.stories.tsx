import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';

const meta: Meta<typeof Layout> = {
  component: Layout,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Layout>;

export const Dashboard: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/']}>
      <Layout>
        <div className="p-8">
          <h1 className="font-serif text-4xl text-ink">Dashboard</h1>
        </div>
      </Layout>
    </MemoryRouter>
  ),
};

export const Clientes: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/clientes']}>
      <Layout>
        <div className="p-8">
          <h1 className="font-serif text-4xl text-ink">Clientes</h1>
        </div>
      </Layout>
    </MemoryRouter>
  ),
};

export const Planes: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/planes']}>
      <Layout>
        <div className="p-8">
          <h1 className="font-serif text-4xl text-ink">Planes</h1>
        </div>
      </Layout>
    </MemoryRouter>
  ),
};

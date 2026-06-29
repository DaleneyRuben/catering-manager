import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from '@ui/Pagination';

const meta: Meta<typeof Pagination> = {
  component: Pagination,
  decorators: [
    (Story) => (
      <div className="w-[640px] border border-rule rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

function Demo({ total }: { total: number }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  return (
    <Pagination
      page={page}
      total={total}
      limit={limit}
      onChange={setPage}
      onLimitChange={(l) => {
        setLimit(l);
        setPage(1);
      }}
    />
  );
}

export const FewPages: Story = { render: () => <Demo total={45} /> };
export const ManyPages: Story = { render: () => <Demo total={230} /> };

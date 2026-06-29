import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagInput } from '@/components/ui/TagInput';

const meta: Meta<typeof TagInput> = {
  component: TagInput,
  decorators: [
    (Story) => (
      <div className="w-96 p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TagInput>;

function WithTagsDemo() {
  const [tags, setTags] = useState(['Vegano', 'Sin gluten', 'Sin lactosa']);
  const [input, setInput] = useState('');
  return (
    <TagInput
      label="Restricciones"
      tags={tags}
      input={input}
      setInput={setInput}
      onAdd={() => {
        if (input.trim()) {
          setTags([...tags, input.trim()]);
          setInput('');
        }
      }}
      onRemove={(v) => setTags(tags.filter((t) => t !== v))}
    />
  );
}

function EmptyDemo() {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState('');
  return (
    <TagInput
      label="Alergias"
      tags={tags}
      input={input}
      setInput={setInput}
      onAdd={() => {
        if (input.trim()) {
          setTags([...tags, input.trim()]);
          setInput('');
        }
      }}
      onRemove={(v) => setTags(tags.filter((t) => t !== v))}
    />
  );
}

export const WithTags: Story = { render: () => <WithTagsDemo /> };
export const Empty: Story = { render: () => <EmptyDemo /> };

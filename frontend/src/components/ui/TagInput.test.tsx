import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

function renderTagInput(tags: string[] = ['gluten', 'lactosa']) {
  const setInput = jest.fn();
  const onAdd = jest.fn();
  const onRemove = jest.fn();
  render(
    <TagInput
      label="Restricciones"
      tags={tags}
      input=""
      setInput={setInput}
      onAdd={onAdd}
      onRemove={onRemove}
    />,
  );
  return { setInput, onAdd, onRemove };
}

describe('TagInput', () => {
  it('renders the label', () => {
    renderTagInput();
    expect(screen.getByText('Restricciones')).toBeInTheDocument();
  });

  it('renders a chip for each tag', () => {
    renderTagInput();
    expect(screen.getByText('gluten')).toBeInTheDocument();
    expect(screen.getByText('lactosa')).toBeInTheDocument();
  });

  it('calls onRemove with the tag when its remove button is clicked', async () => {
    const { onRemove } = renderTagInput();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar gluten' }));
    expect(onRemove).toHaveBeenCalledWith('gluten');
  });

  it('calls onAdd when the add button is clicked', async () => {
    const { onAdd } = renderTagInput();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('calls onAdd when Enter is pressed in the input', async () => {
    const { onAdd } = renderTagInput();
    await userEvent.type(screen.getByPlaceholderText(/escribe/i), '{Enter}');
    expect(onAdd).toHaveBeenCalled();
  });

  it('calls setInput as the user types', async () => {
    const { setInput } = renderTagInput();
    await userEvent.type(screen.getByPlaceholderText(/escribe/i), 'a');
    expect(setInput).toHaveBeenCalledWith('a');
  });

  it('renders no chips when tags array is empty', () => {
    renderTagInput([]);
    expect(screen.queryByRole('button', { name: /quitar/i })).not.toBeInTheDocument();
  });
});

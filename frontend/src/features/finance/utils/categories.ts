import type { ExpenseCategory } from '@/features/finance/types';

// Adding a category by name has three outcomes and the button looks identical in all of them: a
// duplicate name folds onto the category that already answers to it rather than erroring, and if
// that one was archived the fold restored it. Comparing what came back against the catalog as it
// stood is what says which happened — the response alone cannot, since `api` drops the 201/200.
export const categoryAddedMessage = (
  added: ExpenseCategory,
  catalog: ExpenseCategory[],
): string => {
  const known = catalog.find((category) => category.id === added.id);
  if (known === undefined) return `Categoría «${added.name}» creada`;

  return known.active
    ? `Ya existe la categoría «${added.name}»`
    : `Categoría «${added.name}» restaurada`;
};

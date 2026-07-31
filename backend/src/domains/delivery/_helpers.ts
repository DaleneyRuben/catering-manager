// A delivery group counts as one stop regardless of how many members it has
// (see docs/business-rules.md). Clients without a group token are one stop each.
export const countStops = (groupTokens: (string | null)[]): number => {
  const groups = new Set<string>();
  let singles = 0;

  groupTokens.forEach((token) => {
    if (token) groups.add(token);
    else singles += 1;
  });

  return groups.size + singles;
};

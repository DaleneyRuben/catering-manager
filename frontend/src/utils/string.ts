export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('');
}

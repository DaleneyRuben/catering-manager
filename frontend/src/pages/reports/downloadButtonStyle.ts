// Design swaps disabled download buttons to a literal gray, not a dimmed green —
// override Button's default disabled:opacity-60 with the exact gray instead.
export const DISABLED_DOWNLOAD_STYLE = {
  opacity: 1,
  backgroundColor: 'var(--color-disabled-bg)',
  color: 'var(--color-empty-text)',
  cursor: 'not-allowed',
};

// Escapes LIKE metacharacters so a query like "%" or "_" is matched literally
// instead of acting as a wildcard.
export const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&');

// Lowercases and strips diacritics, so "verduleria" finds "verdulería".
//
// This must stay in step with the SQL side, which folds the column with translate() rather than
// the unaccent extension — unaccent would need a migration and a database-level install, and over
// one month of rows the lost index is irrelevant. NFD splits an accented letter into its base plus
// a combining mark, which the range below removes; ñ and ü fold to n and u exactly as translate()
// maps them.
export const foldAccents = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// The full pattern for a free-text search: folded, escaped, and wrapped in wildcards.
export const likePattern = (value: string) => `%${escapeLikePattern(foldAccents(value))}%`;

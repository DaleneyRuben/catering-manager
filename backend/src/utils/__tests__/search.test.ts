import { escapeLikePattern, foldAccents, likePattern } from '../search';

describe('escapeLikePattern', () => {
  it('leaves an ordinary term untouched', () => {
    expect(escapeLikePattern('verduleria')).toBe('verduleria');
  });

  it('escapes LIKE wildcards so they match literally', () => {
    expect(escapeLikePattern('50% off')).toBe('50\\% off');
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
  });

  it('escapes the escape character itself', () => {
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });
});

describe('foldAccents', () => {
  // Mirrors what the SQL side does with translate(), so a folded term and a folded column match.
  it('strips accents and lowercases', () => {
    expect(foldAccents('Verdulería')).toBe('verduleria');
    expect(foldAccents('ÁÉÍÓÚ')).toBe('aeiou');
  });

  it('folds ñ and ü the same way translate() does', () => {
    expect(foldAccents('Muñoz')).toBe('munoz');
    expect(foldAccents('pingüino')).toBe('pinguino');
  });

  it('leaves an unaccented term unchanged', () => {
    expect(foldAccents('insumos')).toBe('insumos');
  });
});

describe('likePattern', () => {
  it('wraps a term in wildcards, folded and escaped', () => {
    expect(likePattern('Verdulería')).toBe('%verduleria%');
    expect(likePattern('50%')).toBe('%50\\%%');
  });
});

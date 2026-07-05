import { MEAL_FIELDS, MEAL_FIELD_LABELS, emptyDraft } from '@/features/menu/menuFields';

describe('MEAL_FIELDS', () => {
  it('lists every meal field key', () => {
    expect(MEAL_FIELDS).toEqual([
      'breakfast',
      'morningSnack',
      'salad',
      'lunch',
      'afternoonSnack',
      'dinner',
      'juice',
    ]);
  });
});

describe('MEAL_FIELD_LABELS', () => {
  it('has a label for every meal field', () => {
    MEAL_FIELDS.forEach((field) => {
      expect(MEAL_FIELD_LABELS[field]).toBeTruthy();
    });
  });
});

describe('emptyDraft', () => {
  it('returns a draft with the given date and every meal field null', () => {
    expect(emptyDraft('2026-07-06')).toEqual({
      date: '2026-07-06',
      breakfast: null,
      morningSnack: null,
      salad: null,
      lunch: null,
      afternoonSnack: null,
      dinner: null,
      juice: null,
    });
  });
});

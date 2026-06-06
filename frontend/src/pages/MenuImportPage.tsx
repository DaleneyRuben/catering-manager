import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { MEAL_LABELS } from '../constants/meals';
import { useMenu } from '../hooks/useMenu';
import type { MenuDraft } from '../types/menu';

function getSaveLabel(isSaving: boolean, hasExisting: boolean): string {
  if (isSaving) return 'Guardando...';
  if (hasExisting) return 'Actualizar menú';
  return 'Guardar menú';
}

const MEAL_FIELDS = [
  'breakfast',
  'morningSnack',
  'salad',
  'lunch',
  'afternoonSnack',
  'dinner',
  'juice',
] as const;

type MealField = (typeof MEAL_FIELDS)[number];

const MEAL_FIELD_LABELS: Record<MealField, string> = {
  breakfast: MEAL_LABELS.breakfast,
  morningSnack: MEAL_LABELS.morning_snack,
  salad: MEAL_LABELS.salad,
  lunch: MEAL_LABELS.lunch,
  afternoonSnack: MEAL_LABELS.afternoon_snack,
  dinner: MEAL_LABELS.dinner,
  juice: MEAL_LABELS.juice,
};

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

const emptyDraft = (date: string): MenuDraft => ({
  date,
  breakfast: null,
  morningSnack: null,
  salad: null,
  lunch: null,
  afternoonSnack: null,
  dinner: null,
  juice: null,
});

export function MenuImportPage() {
  const today = toIso(new Date());
  const tomorrow = toIso(addDays(new Date(), 1));

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [draft, setDraft] = useState<MenuDraft>(emptyDraft(today));
  const [saved, setSaved] = useState(false);

  const { menus, isLoading, isSaving, save } = useMenu();

  const existingMenu = menus.find((m) => m.date === selectedDate);

  useEffect(() => {
    if (existingMenu) {
      setDraft({
        date: existingMenu.date,
        breakfast: existingMenu.breakfast,
        morningSnack: existingMenu.morningSnack,
        salad: existingMenu.salad,
        lunch: existingMenu.lunch,
        afternoonSnack: existingMenu.afternoonSnack,
        dinner: existingMenu.dinner,
        juice: existingMenu.juice,
      });
    } else {
      setDraft(emptyDraft(selectedDate));
    }
    setSaved(false);
  }, [selectedDate, existingMenu]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSaved(false);
  };

  const handleFieldChange = (field: MealField, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value || null }));
    setSaved(false);
  };

  const handleSave = async () => {
    await save({ ...draft, date: selectedDate });
    setSaved(true);
  };

  const formatDateLabel = (iso: string) =>
    format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });

  const storedMenus = menus.filter((m) => m.date !== selectedDate);

  const saveLabel = getSaveLabel(isSaving, !!existingMenu);

  return (
    <div className="p-7 max-w-[900px] mx-auto">
      <div className="mb-7">
        <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-2">
          Operativa diaria
        </p>
        <h1 className="font-serif text-[44px] leading-none text-ink">Menú del día</h1>
        <p className="text-[13px] text-muted mt-2.5">
          Registra el menú para que el sistema pueda cruzarlo con las restricciones de los clientes.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {[today, tomorrow].map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => handleDateChange(date)}
            className={`px-4 py-2 rounded-md text-[13px] font-semibold border transition-colors capitalize ${
              selectedDate === date
                ? 'bg-olive-800 text-white border-olive-800'
                : 'bg-paper text-ink border-rule hover:border-olive-700'
            }`}
          >
            {date === today ? 'Hoy' : 'Mañana'} —{' '}
            <span className="font-normal">{formatDateLabel(date)}</span>
          </button>
        ))}
      </div>

      <div className="bg-paper border border-rule rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 gap-4">
          {MEAL_FIELDS.map((field) => (
            <div key={field}>
              <label
                htmlFor={`menu-field-${field}`}
                className="block text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-1.5"
              >
                {MEAL_FIELD_LABELS[field]}
              </label>
              <input
                id={`menu-field-${field}`}
                type="text"
                value={draft[field] ?? ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="w-full px-3 py-2.5 text-[13px] bg-white border border-rule rounded-md focus:outline-none focus:border-olive-700 text-ink transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 disabled:opacity-50 transition-colors"
          >
            {saveLabel}
          </button>
          {saved && (
            <span className="text-[12px] text-olive-700 font-mono">
              Menú guardado correctamente
            </span>
          )}
        </div>
      </div>

      {!isLoading && storedMenus.length > 0 && (
        <div>
          <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-3">
            Menús guardados
          </p>
          <div className="flex flex-col gap-3">
            {storedMenus.map((menu) => (
              <div key={menu.date} className="bg-paper border border-rule rounded-lg p-4">
                <p className="text-[11px] font-mono text-muted mb-2 capitalize">
                  {formatDateLabel(menu.date)}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {MEAL_FIELDS.map((field) =>
                    menu[field] ? (
                      <div key={field} className="flex gap-2 text-[12.5px]">
                        <span className="text-muted shrink-0">{MEAL_FIELD_LABELS[field]}:</span>
                        <span className="text-ink">{menu[field]}</span>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

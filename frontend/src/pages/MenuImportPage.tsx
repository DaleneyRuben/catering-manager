import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import type { Menu, MenuDraft } from '../types/menu';
import { useMenu } from '../hooks/useMenu';
import { checkIsWeekend } from '../utils/devFlags';
import { MEAL_FIELDS, MEAL_FIELD_LABELS } from './menu/menuFields';
import { MenuFormModal } from './menu/MenuFormModal';

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

const formatDateLabel = (iso: string) => {
  const s = format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

interface MenuCardProps {
  menu: Menu;
  onEdit: () => void;
}

function MenuCard({ menu, onEdit }: MenuCardProps) {
  const filled = MEAL_FIELDS.filter((f) => menu[f]);
  return (
    <div className="bg-paper border border-rule rounded-lg p-5">
      <div className="flex items-center mb-4">
        <p className="text-[11px] font-mono text-muted">{formatDateLabel(menu.date)}</p>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar menú"
          className="ml-auto text-muted hover:text-ink transition-colors"
        >
          <Icon name="pencil" size={13} />
        </button>
      </div>
      {filled.length === 0 ? (
        <p className="text-[13px] text-muted">Sin platos cargados.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {filled.map((field) => (
            <div key={field}>
              <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
                {MEAL_FIELD_LABELS[field]}
              </p>
              <p className="text-[13px] text-ink">{menu[field]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MenuImportPage() {
  const today = toIso(new Date());
  const tomorrow = toIso(addDays(new Date(), 1));

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string>(today);

  const { menus, isSaving, save } = useMenu();

  const selectedMenu = menus.find((m) => m.date === selectedDate) ?? null;
  const otherDate = selectedDate === today ? tomorrow : today;
  const otherMenu = menus.find((m) => m.date === otherDate) ?? null;
  const isSelectedWeekend = checkIsWeekend(parseISO(selectedDate));

  const openModal = (date: string) => {
    setEditingDate(date);
    setModalOpen(true);
  };

  const handleSave = async (draft: MenuDraft) => {
    await save(draft);
  };

  return (
    <div className="px-4 py-5 lg:p-7 max-w-[900px] mx-auto">
      <PageHeader label="Operativa diaria" title="Menú del día" />

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        {[today, tomorrow].map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => setSelectedDate(date)}
            className={`flex-1 px-4 py-2.5 rounded-md text-[13px] font-semibold border transition-colors text-left ${
              selectedDate === date
                ? 'bg-olive-800 text-white border-olive-800'
                : 'bg-paper text-ink border-rule hover:border-olive-700'
            }`}
          >
            {date === today ? 'Hoy' : 'Mañana'}{' '}
            <span className="font-normal">— {formatDateLabel(date)}</span>
          </button>
        ))}
      </div>

      {isSelectedWeekend && (
        <div className="bg-paper border border-rule rounded-lg p-6">
          <p className="text-[13px] text-alert">No hay entregas los fines de semana.</p>
        </div>
      )}
      {!isSelectedWeekend && selectedMenu && (
        <MenuCard menu={selectedMenu} onEdit={() => openModal(selectedDate)} />
      )}
      {!isSelectedWeekend && !selectedMenu && (
        <div className="bg-paper border border-rule rounded-lg p-8 flex flex-col items-center text-center gap-3">
          <p className="text-[13px] text-muted">No hay menú cargado para este día.</p>
          <Button onClick={() => openModal(selectedDate)} leftIcon="plus">
            Cargar menú
          </Button>
        </div>
      )}

      {otherMenu && (
        <div className="mt-6">
          <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-3">
            {otherDate === today ? 'Hoy' : 'Mañana'}
          </p>
          <MenuCard menu={otherMenu} onEdit={() => openModal(otherDate)} />
        </div>
      )}

      <MenuFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={editingDate}
        dateLabel={formatDateLabel(editingDate)}
        initial={menus.find((m) => m.date === editingDate) ?? null}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}

import { addDays, format, getDay, parseISO, startOfISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { PageHeader } from '@ui/PageHeader';
import type { MenuDraft } from '@/features/menu/types';
import { useMenu } from '@/features/menu/hooks/useMenu';
import { checkIsWeekend } from '@/utils/devFlags';
import { formatLongDate } from '@/utils/format';
import { MenuFormModal } from '@/features/menu/components/MenuFormModal';
import { DayCard } from '@/features/menu/components/DayCard';
import { MenuImportSkeleton } from '@/features/menu/components/MenuImportSkeleton';
import { WeekGrid } from '@/features/menu/components/WeekGrid';

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

function getWeekDays(): string[] {
  const today = new Date();
  const dow = getDay(today); // 0=Sun
  const monday = dow === 0 ? addDays(today, 1) : startOfISOWeek(today);
  return [0, 1, 2, 3, 4].map((i) => toIso(addDays(monday, i)));
}

export function MenuImportPage() {
  const today = toIso(new Date());
  const tomorrow = toIso(addDays(new Date(), 1));
  const weekDays = getWeekDays();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string>(today);

  const { menus, isLoading, isSaving, save } = useMenu();

  const todayMenu = menus.find((m) => m.date === today) ?? null;
  const tomorrowMenu = menus.find((m) => m.date === tomorrow) ?? null;
  const isTodayWeekend = checkIsWeekend(parseISO(today));
  const isTomorrowWeekend = checkIsWeekend(parseISO(tomorrow));

  const weekRangeLabel = `${format(parseISO(weekDays[0]), 'd')} – ${format(parseISO(weekDays[4]), 'd MMM', { locale: es })}`;

  const openModal = (date: string) => {
    setEditingDate(date);
    setModalOpen(true);
  };

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader label="Operativa diaria" title="Menú del día" />

      {isLoading ? (
        <MenuImportSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px] mb-[30px]">
            <DayCard
              isToday
              date={today}
              menu={todayMenu}
              isWeekend={isTodayWeekend}
              onOpen={() => openModal(today)}
            />
            <DayCard
              isToday={false}
              date={tomorrow}
              menu={tomorrowMenu}
              isWeekend={isTomorrowWeekend}
              onOpen={() => openModal(tomorrow)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-serif font-semibold text-[24px] text-ink">Esta semana</h2>
            <span className="font-mono text-[11.5px] tracking-[.04em] text-muted">
              {weekRangeLabel}
            </span>
          </div>
          <WeekGrid weekDays={weekDays} menus={menus} today={today} />
        </>
      )}

      <MenuFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={editingDate}
        dateLabel={formatLongDate(editingDate)}
        initial={menus.find((m) => m.date === editingDate) ?? null}
        onSave={async (draft: MenuDraft) => {
          await save(draft);
        }}
        isSaving={isSaving}
      />
    </div>
  );
}

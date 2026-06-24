import { PageHeader } from '../components/ui/PageHeader';
import { Icon } from '../components/ui/Icon';

export function DashboardPage() {
  return (
    <div className="px-4 py-5 lg:p-7 max-w-[860px] mx-auto">
      <PageHeader label="Vista general" title="Panel" />

      <div className="py-16 text-center bg-paper border border-rule rounded-lg">
        <div className="w-12 h-12 rounded-full bg-cream mx-auto mb-3 flex items-center justify-center text-olive-700">
          <Icon name="dashboard" size={22} />
        </div>
        <p className="font-semibold text-ink">Trabajando en esto</p>
        <p className="text-sm text-muted mt-1">Esta sección estará disponible próximamente.</p>
      </div>
    </div>
  );
}

import { useAuth } from '@/features/auth/AuthContext';
import { ROLES } from '@/constants/roles';
import { AdminEvaluationsView } from '@/features/evaluations/components/AdminEvaluationsView';
import { NutritionistEvaluationsView } from '@/features/evaluations/components/NutritionistEvaluationsView';

export function EvaluacionesPage() {
  const { user } = useAuth();

  return user?.role === ROLES.NUTRITIONIST ? (
    <NutritionistEvaluationsView />
  ) : (
    <AdminEvaluationsView />
  );
}

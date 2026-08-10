import { QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => toast.error(error.message),
  }),
});

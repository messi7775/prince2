import { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '../components/ui/tooltip';
import { createQueryClient } from '../lib/query-client';

const queryClient = createQueryClient();

interface ProvidersProps {
  children: ReactNode;
}

/**
 * providers — App-wide providers.
 *
 * - QueryClientProvider (TanStack Query)
 * - TooltipProvider (Radix)
 *
 * في D8-I:
 * - AuthProvider (يُضاف هنا)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
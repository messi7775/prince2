import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Providers } from './providers';
import { Toaster } from '../components/ui/toaster';

/**
 * App — Root component.
 * يجمع Providers + RouterProvider + Toaster.
 */
export function App() {
  return (
    <Providers>
      <RouterProvider
        router={router}
        future={{ v7_startTransition: true }}
      />
      <Toaster />
    </Providers>
  );
}

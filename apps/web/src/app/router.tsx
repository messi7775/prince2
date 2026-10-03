import { createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';

/**
 * router — createBrowserRouter instance.
 * يدعم loaders, actions, errorElement.
 *
 * type annotation صريح (ReturnType) لتفادي TS2742 مع tsc -b.
 * السبب: نوع inferred لـ react-router-dom يعتمد على @remix-run/router
 * داخليًا، وtsc -b لا يستطيع تسميته بشكل portable بدون annotation.
 */
export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter(routes);

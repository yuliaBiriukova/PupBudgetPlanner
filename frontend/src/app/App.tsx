import { RouterProvider } from 'react-router/dom';
import { AppProviders } from './AppProviders';
import { ThemeColorMeta } from './pwa/ThemeColorMeta';
import { UpdateNotice } from './pwa/UpdateNotice';
import { router } from './router';

export function App() {
  return (
    <AppProviders>
      <ThemeColorMeta />
      <UpdateNotice />
      <RouterProvider router={router} />
    </AppProviders>
  );
}

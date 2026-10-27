import type { RouteObject } from 'react-router';
import { HomePage } from '../features/home/HomePage';
import { NotFoundPage } from './NotFoundPage';

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
];

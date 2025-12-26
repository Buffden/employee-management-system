import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static routes that can be prerendered
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'login',
    renderMode: RenderMode.Server
  },
  {
    path: 'activate',
    renderMode: RenderMode.Server
  },
  {
    path: 'reset',
    renderMode: RenderMode.Server
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'employees',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'departments',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'profile',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'projects',
    renderMode: RenderMode.Prerender
  },
  // Dynamic routes with parameters - use server-side rendering
  {
    path: 'projects/:projectId',
    renderMode: RenderMode.Server
  },
  {
    path: 'projects/:projectId/tasks/:taskId',
    renderMode: RenderMode.Server
  },
  // Fallback for all other routes
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];

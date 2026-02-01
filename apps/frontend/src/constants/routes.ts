export const ROUTES = {
  HOME: '/',
  STORE: '/store',
  SERVICES: '/services',
  DASHBOARD: '/dashboard',
  AI_ASSISTANT: '/ai-assistant',
  LOGIN: '/login',
  SIGNUP: '/signup',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];

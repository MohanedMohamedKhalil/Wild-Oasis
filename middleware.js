import { auth } from './app/_lib/auth';

export const middleware = auth;

// ❗ apply this middlware for account Route only
export const config = {
  matcher: ['/account'],
};

export { default } from 'next-auth/middleware';

export const config = {
  // Protege todas las rutas EXCEPTO login, api/auth, api/setup y archivos estáticos
  matcher: [
    '/((?!login|api/auth|api/setup|_next/static|_next/image|favicon.ico).*)',
  ],
};

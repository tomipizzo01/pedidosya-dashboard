import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Gestor Finanzas — Cadete',
  description: 'Sistema de gestión financiera para cadetes de delivery',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

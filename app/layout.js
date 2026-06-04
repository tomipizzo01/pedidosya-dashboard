import "./globals.css";

export const metadata = {
  title: "Gestor Finanzas — Pedidos Ya | Nico Acosta",
  description: "Dashboard financiero de cadete PedidosYa — Tucumán",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

'use client';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/',              label: 'Dashboard'       },
  { href: '/registro',      label: 'Registros'       },
  { href: '/configuracion', label: 'Configuración'   },
];

const s = {
  aside: {
    width: 200, minHeight: '100vh',
    background: '#080808',
    borderRight: '1px solid #1c1c1c',
    display: 'flex', flexDirection: 'column',
    flexShrink: 0, position: 'sticky', top: 0,
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid #1c1c1c',
  },
  logoText: {
    fontSize: 15, fontWeight: 700,
    color: '#e5e5e5', letterSpacing: '-0.01em',
  },
  logoSub: {
    fontSize: 11, color: '#3a3a3a',
    marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  user: {
    padding: '16px 20px',
    borderBottom: '1px solid #1c1c1c',
  },
  userLabel: {
    fontSize: 10, color: '#3a3a3a',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    marginBottom: 4,
  },
  userName: {
    fontSize: 13, fontWeight: 500, color: '#e5e5e5',
  },
  userRole: {
    fontSize: 11, color: '#525252', marginTop: 2,
  },
  nav: { flex: 1, padding: '12px 0' },
  logout: {
    padding: '16px 20px',
    borderTop: '1px solid #1c1c1c',
  },
  logoutBtn: {
    width: '100%', background: 'transparent',
    border: '1px solid #1c1c1c', color: '#525252',
    padding: '8px 0', borderRadius: 4, fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.1s',
  },
};

export default function Sidebar() {
  const { data: session } = useSession();
  const path = usePathname();

  return (
    <aside style={s.aside}>
      <div style={s.logo}>
        <div style={s.logoText}>GestorPro</div>
        <div style={s.logoSub}>Cadete · PedidosYa</div>
      </div>

      {session && (
        <div style={s.user}>
          <div style={s.userLabel}>Sesión</div>
          <div style={s.userName}>{session.user.nombre || session.user.email}</div>
          <div style={s.userRole}>{session.user.rol || 'cadete'}</div>
        </div>
      )}

      <nav style={s.nav} aria-label="Navegación principal">
        {NAV.map(({ href, label }) => {
          const active = path === href || (href !== '/' && path.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              display: 'block',
              padding: '10px 20px',
              fontSize: 13,
              textDecoration: 'none',
              color: active ? '#e5e5e5' : '#525252',
              borderLeft: `2px solid ${active ? '#e03535' : 'transparent'}`,
              background: active ? '#0f0f0f' : 'transparent',
              transition: 'all 0.1s',
            }}>
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={s.logout}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={s.logoutBtn}
          onMouseEnter={e => { e.target.style.color = '#e5e5e5'; e.target.style.borderColor = '#2a2a2a'; }}
          onMouseLeave={e => { e.target.style.color = '#525252'; e.target.style.borderColor = '#1c1c1c'; }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

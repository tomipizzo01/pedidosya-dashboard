'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

const C = {
  bg: '#080808', border: '#1c1c1c', text: '#e5e5e5',
  muted: '#525252', accent: '#e03535',
};

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email:    form.email.trim(),
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (!res?.ok || res?.error) {
      setError('Email o contraseña incorrectos.');
    } else {
      window.location.href = '/';
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system,"Segoe UI",system-ui,sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
            GestorPro
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sistema de gestión cadete
          </div>
        </div>

        {error && (
          <div role="alert" style={{
            border: `1px solid ${C.accent}`,
            color: C.accent, padding: '10px 14px',
            borderRadius: 4, marginBottom: 20, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="email" style={{
              display: 'block', fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: C.muted, marginBottom: 8,
            }}>
              Email
            </label>
            <input
              id="email" type="email" required autoComplete="email" autoFocus
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              style={{
                width: '100%', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '11px 14px', color: C.text, fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.1s',
              }}
              onFocus={e  => e.target.style.borderColor = '#2a2a2a'}
              onBlur={e   => e.target.style.borderColor = C.border}
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block', fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: C.muted, marginBottom: 8,
            }}>
              Contraseña
            </label>
            <input
              id="password" type="password" required autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              style={{
                width: '100%', background: 'transparent',
                border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '11px 14px', color: C.text, fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.1s',
              }}
              onFocus={e  => e.target.style.borderColor = '#2a2a2a'}
              onBlur={e   => e.target.style.borderColor = C.border}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', background: loading ? '#991b1b' : C.accent,
              color: '#fff', border: 'none', borderRadius: 4,
              padding: '12px', fontSize: 14, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8, fontFamily: 'inherit',
              transition: 'background 0.1s',
            }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: 32, fontSize: 11, color: '#2a2a2a', textAlign: 'center' }}>
          Acceso restringido
        </div>
      </div>
    </div>
  );
}

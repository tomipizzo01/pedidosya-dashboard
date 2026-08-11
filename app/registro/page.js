'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';

const C = {
  bg: '#080808', surface: '#0f0f0f', border: '#1c1c1c',
  hover: '#141414', text: '#e5e5e5', muted: '#525252',
  accent: '#e03535', green: '#16a34a',
};

const pesos = (n) => n == null ? '—' : '$' + Math.round(n).toLocaleString('es-AR');
const fmtFecha = (iso) => iso ? iso.split('-').reverse().join('/') : '—';

export default function RegistroPage() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [mes, setMes]             = useState('');
  const [deleting, setDeleting]   = useState(null);
  const [msg, setMsg]             = useState({ text: '', ok: true });

  async function cargar(mesVal) {
    setLoading(true);
    const qs  = mesVal ? `?mes=${mesVal}` : '';
    const res = await fetch(`/api/registros${qs}`);
    const json = await res.json();
    setRegistros(json.registros || []);
    setLoading(false);
  }

  useEffect(() => { cargar(mes); }, [mes]);

  async function eliminar(id, fecha) {
    if (!confirm(`¿Eliminar el registro del ${fmtFecha(fecha)}?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/registros/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMsg({ text: 'Registro eliminado.', ok: true });
      cargar(mes);
    } else {
      setMsg({ text: 'Error al eliminar.', ok: false });
    }
    setDeleting(null);
    setTimeout(() => setMsg({ text: '', ok: true }), 3000);
  }

  const totalGanancia = registros.reduce((a, r) => a + (r.ganancia_real || 0), 0);
  const totalGastos   = registros.reduce((a, r) => a + ((r.nafta||0)+(r.comida||0)+(r.otros_gastos||0)), 0);
  const totalPedidos  = registros.reduce((a, r) => a + (r.pedidos || 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: '-apple-system,"Segoe UI",system-ui,sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Registros diarios</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {registros.length} registros{mes ? ` · ${mes}` : ''} · Ganancia: {pesos(totalGanancia)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="month" value={mes}
              onChange={e => setMes(e.target.value)}
              style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, padding: '7px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            {mes && (
              <button onClick={() => setMes('')} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '7px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                Todos
              </button>
            )}
            <Link href="/registro/nuevo" style={{ background: C.accent, color: '#fff', padding: '8px 16px', borderRadius: 4, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              + Nuevo
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: '32px', overflowX: 'auto' }}>
          {/* Mensaje */}
          {msg.text && (
            <div style={{ border: `1px solid ${msg.ok ? C.green : C.accent}`, color: msg.ok ? C.green : C.accent, padding: '10px 14px', borderRadius: 4, marginBottom: 20, fontSize: 13 }}>
              {msg.text}
            </div>
          )}

          {/* Summary stats */}
          {registros.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24, maxWidth: 600 }}>
              {[
                ['Ganancia total', pesos(totalGanancia), C.green],
                ['Gastos total',   pesos(totalGastos),   '#dc2626'],
                ['Pedidos total',  totalPedidos,          C.text],
              ].map(([label, val, color]) => (
                <div key={label} style={{ padding: '16px', border: `1px solid ${C.border}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: C.muted, fontSize: 13 }}>Cargando…</div>
          ) : registros.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center' }}>
              <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>No hay registros{mes ? ` en ${mes}` : ''} todavía.</div>
              <Link href="/registro/nuevo" style={{ color: C.accent, fontSize: 13, textDecoration: 'none', borderBottom: `1px solid ${C.accent}` }}>
                Crear el primero →
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Fecha','Día','Saldo ini.','Generado','Gastos','Ganancia real','Pedidos','Horas','$/hora','Clima','Acciones'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: C.muted, fontWeight: 500, whiteSpace: 'nowrap',
                        borderBottom: `1px solid ${C.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const gananciaReal = r.ganancia_real ?? ((r.saldo_inicial||0)+(r.total_generado||0)-(r.nafta||0)-(r.comida||0)-(r.otros_gastos||0));
                    const gastos = (r.nafta||0)+(r.comida||0)+(r.otros_gastos||0);
                    const xHora = r.horas ? Math.round(gananciaReal/r.horas) : null;
                    return (
                      <tr key={r.id}
                        onMouseEnter={e => e.currentTarget.style.background = C.hover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        style={{ transition: 'background 0.1s' }}
                      >
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: C.text }}>{fmtFecha(r.fecha)}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 12 }}>{r.dia_semana || '—'}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, fontVariantNumeric: 'tabular-nums', color: C.text }}>{pesos(r.saldo_inicial)}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, fontVariantNumeric: 'tabular-nums', color: C.text }}>{pesos(r.total_generado)}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, fontVariantNumeric: 'tabular-nums', color: '#dc2626' }}>{pesos(gastos)}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: gananciaReal >= 0 ? C.green : '#dc2626' }}>{pesos(gananciaReal)}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, fontVariantNumeric: 'tabular-nums', color: C.text }}>{r.pedidos ?? '—'}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, color: C.muted }}>{r.horas != null ? r.horas + ' hs' : '—'}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{pesos(xHora)}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 12 }}>{r.clima || '—'}</td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Link href={`/registro/${r.id}/editar`} style={{ color: C.muted, fontSize: 12, textDecoration: 'none', borderBottom: `1px solid ${C.border}` }}>
                              Editar
                            </Link>
                            <button
                              onClick={() => eliminar(r.id, r.fecha)}
                              disabled={deleting === r.id}
                              style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                            >
                              {deleting === r.id ? '…' : 'Eliminar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

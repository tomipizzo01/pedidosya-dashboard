'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

const C = {
  bg: '#080808', surface: '#0f0f0f', border: '#1c1c1c',
  text: '#e5e5e5', muted: '#525252', accent: '#e03535', green: '#16a34a',
};

const inp = {
  width: '100%', background: 'transparent',
  border: `1px solid #1c1c1c`, borderRadius: 4,
  padding: '10px 12px', color: '#e5e5e5',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: '-apple-system,"Segoe UI",system-ui,sans-serif',
};

export default function ConfiguracionPage() {
  const [form, setForm]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(json => {
        const c = json.config || {};
        setForm({
          nombre_cadete:            c.nombre_cadete            ?? '',
          meta_diaria:              c.meta_diaria              ?? '',
          meta_mensual:             c.meta_mensual             ?? '',
          precio_nafta:             c.precio_nafta             ?? '',
          capacidad_tanque:         c.capacidad_tanque         ?? '',
          km_por_litro:             c.km_por_litro             ?? '',
          zona_trabajo:             c.zona_trabajo             ?? '',
          whatsapp_numero:          c.whatsapp_numero          ?? '',
          email_reporte:            c.email_reporte            ?? '',
          enviar_reporte_automatico: c.enviar_reporte_automatico ?? false,
          moneda:                   c.moneda                   ?? 'ARS',
        });
        setLoading(false);
      })
      .catch(() => { setErr('Error cargando configuración.'); setLoading(false); });
  }, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [k]: v }));
  };
  const num = (v) => v === '' ? null : parseFloat(v);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    setSaving(true);
    const body = {
      ...form,
      meta_diaria:      num(form.meta_diaria),
      meta_mensual:     num(form.meta_mensual),
      precio_nafta:     num(form.precio_nafta),
      capacidad_tanque: num(form.capacidad_tanque),
      km_por_litro:     num(form.km_por_litro),
    };
    const res  = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) setErr(json.error || 'Error al guardar.');
    else { setMsg('Guardado correctamente.'); setTimeout(() => setMsg(''), 4000); }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: '-apple-system,"Segoe UI",system-ui,sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 32px' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Configuración</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Personalizá el sistema según tus necesidades</div>
        </header>

        <main style={{ padding: '32px', maxWidth: 720 }}>
          {msg && (
            <div style={{ border: `1px solid ${C.green}`, color: C.green, padding: '10px 14px', borderRadius: 4, marginBottom: 20, fontSize: 13 }}>
              {msg}
            </div>
          )}
          {err && (
            <div style={{ border: `1px solid ${C.accent}`, color: C.accent, padding: '10px 14px', borderRadius: 4, marginBottom: 20, fontSize: 13 }}>
              {err}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '48px 0', color: C.muted, fontSize: 13 }}>Cargando…</div>
          ) : form ? (
            <form onSubmit={handleSubmit}>

              <Bloque title="Perfil del cadete">
                <Grid2>
                  <Campo label="Nombre"><input type="text" placeholder="Nicolás Acosta" value={form.nombre_cadete} onChange={set('nombre_cadete')} style={inp} /></Campo>
                  <Campo label="Zona de trabajo"><input type="text" placeholder="Centro Tucumán" value={form.zona_trabajo} onChange={set('zona_trabajo')} style={inp} /></Campo>
                </Grid2>
              </Bloque>

              <Bloque title="Metas financieras">
                <Grid2>
                  <Campo label="Meta diaria ($)"><input type="number" step="100" min="0" placeholder="20000" value={form.meta_diaria} onChange={set('meta_diaria')} style={inp} /></Campo>
                  <Campo label="Meta mensual ($)"><input type="number" step="1000" min="0" placeholder="600000" value={form.meta_mensual} onChange={set('meta_mensual')} style={inp} /></Campo>
                </Grid2>
                <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>Las metas se usan en el dashboard para calcular el progreso mensual.</div>
              </Bloque>

              <Bloque title="Vehículo y nafta">
                <Grid3>
                  <Campo label="Precio nafta ($/L)"><input type="number" step="1" min="0" placeholder="1150" value={form.precio_nafta} onChange={set('precio_nafta')} style={inp} /></Campo>
                  <Campo label="Capacidad tanque (L)"><input type="number" step="0.5" min="0" placeholder="14" value={form.capacidad_tanque} onChange={set('capacidad_tanque')} style={inp} /></Campo>
                  <Campo label="Rendimiento (km/L)"><input type="number" step="0.1" min="0" placeholder="25" value={form.km_por_litro} onChange={set('km_por_litro')} style={inp} /></Campo>
                </Grid3>
                {form.precio_nafta && form.capacidad_tanque && (
                  <div style={{ marginTop: 10, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, color: C.muted }}>
                    Costo de llenar el tanque: <span style={{ color: C.text, fontWeight: 500 }}>
                      ${(parseFloat(form.precio_nafta) * parseFloat(form.capacidad_tanque)).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </span>
                    {form.km_por_litro && <>  · Autonomía: <span style={{ color: C.text, fontWeight: 500 }}>
                      {(parseFloat(form.capacidad_tanque) * parseFloat(form.km_por_litro)).toFixed(0)} km
                    </span></>}
                  </div>
                )}
              </Bloque>

              <Bloque title="Reportes y notificaciones">
                <Grid2>
                  <Campo label="WhatsApp"><input type="tel" placeholder="5493816123456" value={form.whatsapp_numero} onChange={set('whatsapp_numero')} style={inp} /></Campo>
                  <Campo label="Email para reportes"><input type="email" placeholder="nico@gmail.com" value={form.email_reporte} onChange={set('email_reporte')} style={inp} /></Campo>
                </Grid2>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{
                    width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
                    background: form.enviar_reporte_automatico ? C.accent : C.border,
                    transition: 'background 0.15s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%',
                      background: '#fff', transition: 'left 0.15s',
                      left: form.enviar_reporte_automatico ? 19 : 3,
                    }} />
                  </div>
                  <input type="checkbox" checked={form.enviar_reporte_automatico} onChange={set('enviar_reporte_automatico')} style={{ display: 'none' }} />
                  <span style={{ fontSize: 13, color: C.text }}>Enviar reporte automático diario</span>
                </label>
              </Bloque>

              <Bloque title="General">
                <div style={{ maxWidth: 220 }}>
                  <Campo label="Moneda">
                    <select value={form.moneda} onChange={set('moneda')} style={{ ...inp, cursor: 'pointer' }}>
                      <option value="ARS">ARS — Peso Argentino</option>
                      <option value="USD">USD — Dólar</option>
                      <option value="UYU">UYU — Peso Uruguayo</option>
                    </select>
                  </Campo>
                </div>
              </Bloque>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" disabled={saving} style={{
                  background: saving ? '#7f1d1d' : C.accent, color: '#fff',
                  border: 'none', borderRadius: 4, padding: '11px 28px',
                  fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function Bloque({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#525252', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #1c1c1c' }}>
        {title}
      </div>
      {children}
    </div>
  );
}
function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;
}
function Grid3({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>{children}</div>;
}
function Campo({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#525252', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}

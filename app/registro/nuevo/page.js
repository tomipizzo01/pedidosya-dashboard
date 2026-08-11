'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';

const C = { bg: '#080808', border: '#1c1c1c', text: '#e5e5e5', muted: '#525252', accent: '#e03535', green: '#16a34a' };
const DIAS    = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const CLIMAS  = ['Soleado','Nublado','Lluvioso','Tormentoso','Ventoso','Frío','Caluroso'];

const init = {
  fecha:'', dia_semana:'', saldo_inicial:'50000', total_generado:'',
  efectivo:'', por_app:'', nafta:'', comida:'', otros_gastos:'',
  horas:'', pedidos:'', km:'', clima:'', temperatura:'', energia:'', notas:'',
};

const inp = {
  width:'100%', background:'transparent', border:'1px solid #1c1c1c',
  borderRadius:4, padding:'10px 12px', color:'#e5e5e5', fontSize:13,
  outline:'none', boxSizing:'border-box',
  fontFamily:'-apple-system,"Segoe UI",system-ui,sans-serif',
};

export default function NuevoRegistroPage() {
  const router = useRouter();
  const [form, setForm]   = useState(init);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const num = (v) => v === '' ? null : parseFloat(v);
  const int = (v) => v === '' ? null : parseInt(v, 10);

  const gananciaEstimada = (() => {
    const saldo = parseFloat(form.saldo_inicial) || 0;
    const gen   = parseFloat(form.total_generado) || 0;
    const naf   = parseFloat(form.nafta) || 0;
    const com   = parseFloat(form.comida) || 0;
    const ot    = parseFloat(form.otros_gastos) || 0;
    return saldo + gen - naf - com - ot;
  })();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const body = {
      fecha: form.fecha, dia_semana: form.dia_semana || null,
      saldo_inicial: num(form.saldo_inicial), total_generado: num(form.total_generado),
      efectivo: num(form.efectivo), por_app: num(form.por_app),
      nafta: num(form.nafta), comida: num(form.comida), otros_gastos: num(form.otros_gastos),
      horas: num(form.horas), pedidos: int(form.pedidos), km: num(form.km),
      clima: form.clima || null, temperatura: int(form.temperatura),
      energia: int(form.energia) || null, notas: form.notas || null,
    };
    const res  = await fetch('/api/registros', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error || 'Error al guardar.'); return; }
    router.push('/registro');
    router.refresh();
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg, fontFamily:'-apple-system,"Segoe UI",system-ui,sans-serif' }}>
      <Sidebar />
      <div style={{ flex:1, minWidth:0 }}>
        <header style={{ borderBottom:`1px solid ${C.border}`, padding:'20px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <Link href="/registro" style={{ fontSize:12, color:C.muted, textDecoration:'none' }}>← Volver</Link>
            <div style={{ fontSize:16, fontWeight:600, color:C.text, marginTop:4 }}>Nuevo registro</div>
          </div>
          {(form.saldo_inicial || form.total_generado) && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:C.muted, marginBottom:2 }}>Ganancia estimada</div>
              <div style={{ fontSize:20, fontWeight:600, fontVariantNumeric:'tabular-nums', color: gananciaEstimada >= 0 ? C.green : '#dc2626' }}>
                ${gananciaEstimada.toLocaleString('es-AR', { maximumFractionDigits:0 })}
              </div>
            </div>
          )}
        </header>

        <main style={{ padding:'32px', maxWidth:800 }}>
          {error && (
            <div style={{ border:`1px solid ${C.accent}`, color:C.accent, padding:'10px 14px', borderRadius:4, marginBottom:20, fontSize:13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Bloque title="Fecha y día">
              <Grid2>
                <Campo label="Fecha *"><input type="date" required value={form.fecha} onChange={set('fecha')} style={inp} /></Campo>
                <Campo label="Día de la semana">
                  <select value={form.dia_semana} onChange={set('dia_semana')} style={{ ...inp, cursor:'pointer' }}>
                    <option value="">Auto (calculado)</option>
                    {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Campo>
              </Grid2>
            </Bloque>

            <Bloque title="Ingresos">
              <Grid4>
                {[
                  ['Saldo inicial ($)','saldo_inicial'],
                  ['Total generado ($)','total_generado'],
                  ['Efectivo ($)','efectivo'],
                  ['Por app ($)','por_app'],
                ].map(([label, key]) => (
                  <Campo key={key} label={label}>
                    <input type="number" step="0.01" min="0" placeholder="0" value={form[key]} onChange={set(key)} style={inp} />
                  </Campo>
                ))}
              </Grid4>
            </Bloque>

            <Bloque title="Gastos">
              <Grid3>
                {[['Nafta ($)','nafta'],['Comida ($)','comida'],['Otros ($)','otros_gastos']].map(([label, key]) => (
                  <Campo key={key} label={label}>
                    <input type="number" step="0.01" min="0" placeholder="0" value={form[key]} onChange={set(key)} style={inp} />
                  </Campo>
                ))}
              </Grid3>
            </Bloque>

            <Bloque title="Estadísticas del turno">
              <Grid3>
                <Campo label="Horas trabajadas"><input type="number" step="0.5" min="0" max="24" placeholder="8" value={form.horas} onChange={set('horas')} style={inp} /></Campo>
                <Campo label="Pedidos"><input type="number" step="1" min="0" placeholder="0" value={form.pedidos} onChange={set('pedidos')} style={inp} /></Campo>
                <Campo label="Kilómetros"><input type="number" step="0.1" min="0" placeholder="0" value={form.km} onChange={set('km')} style={inp} /></Campo>
              </Grid3>
            </Bloque>

            <Bloque title="Condiciones">
              <Grid3>
                <Campo label="Clima">
                  <select value={form.clima} onChange={set('clima')} style={{ ...inp, cursor:'pointer' }}>
                    <option value="">Seleccionar…</option>
                    {CLIMAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Campo>
                <Campo label="Temperatura (°C)"><input type="number" step="1" min="-10" max="50" placeholder="20" value={form.temperatura} onChange={set('temperatura')} style={inp} /></Campo>
                <Campo label="Energía (1–5)"><input type="number" step="1" min="1" max="5" placeholder="3" value={form.energia} onChange={set('energia')} style={inp} /></Campo>
              </Grid3>
            </Bloque>

            <Bloque title="Notas">
              <textarea rows={3} placeholder="Observaciones del día…" value={form.notas} onChange={set('notas')}
                style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
            </Bloque>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <Link href="/registro" style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'10px 20px', borderRadius:4, textDecoration:'none', fontSize:13 }}>
                Cancelar
              </Link>
              <button type="submit" disabled={saving} style={{
                background: saving ? '#7f1d1d' : C.accent, color:'#fff',
                border:'none', borderRadius:4, padding:'10px 28px',
                fontSize:13, fontWeight:500, cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily:'inherit',
              }}>
                {saving ? 'Guardando…' : 'Guardar registro'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function Bloque({ title, children }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'#525252', marginBottom:14, paddingBottom:10, borderBottom:'1px solid #1c1c1c' }}>{title}</div>
      {children}
    </div>
  );
}
function Grid2({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>{children}</div>; }
function Grid3({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>{children}</div>; }
function Grid4({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>{children}</div>; }
function Campo({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:'#525252', marginBottom:7 }}>{label}</label>
      {children}
    </div>
  );
}

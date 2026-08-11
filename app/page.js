"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";

// ── Tokens ─────────────────────────────────────────────────────────────────
const C = {
  bg:'#080808', surface:'#0f0f0f', border:'#1c1c1c', hover:'#141414',
  text:'#e5e5e5', muted:'#525252', dim:'#2a2a2a',
  accent:'#e03535', green:'#16a34a', amber:'#ca8a04', blue:'#3b82f6',
};

// ── Formatters ─────────────────────────────────────────────────────────────
const pesos = (v) => v == null ? '—' : '$' + Math.round(v).toLocaleString('es-AR');
const pct   = (v) => v == null ? '—' : Number(v).toFixed(1) + '%';
const fmtFecha = (iso) => {
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const fmtMes = (yyyyMm) => {
  if (!yyyyMm) return '—';
  const [y,m] = yyyyMm.split('-');
  return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(m)-1] + ' ' + y;
};
const fmtActualizacion = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
};

// ── UI atoms ───────────────────────────────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div style={{ padding:'20px 18px', border:`1px solid ${C.border}`, borderRadius:6 }}>
      <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:C.muted, marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:600, fontVariantNumeric:'tabular-nums', color:color||C.text, lineHeight:1 }}>{value}</div>
    </div>
  );
}

function SGrid({ children, cols = 'repeat(auto-fill,minmax(170px,1fr))' }) {
  return <div style={{ display:'grid', gridTemplateColumns:cols, gap:10, marginBottom:28 }}>{children}</div>;
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom:40 }}>
      <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:C.muted, borderBottom:`1px solid ${C.border}`, paddingBottom:10, marginBottom:20 }}>{title}</div>
      {children}
    </section>
  );
}

const TH = ({ children, right }) => (
  <th style={{ padding:'9px 14px', textAlign:right?'right':'left', fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', color:C.muted, fontWeight:500, whiteSpace:'nowrap', borderBottom:`1px solid ${C.border}` }}>{children}</th>
);
const TD = ({ children, right, bold, color, muted }) => (
  <td style={{ padding:'9px 14px', textAlign:right?'right':'left', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', borderBottom:`1px solid ${C.border}`, color:color||(muted?C.muted:C.text), fontWeight:bold?600:400, fontSize:13 }}>{children}</td>
);
const TR = ({ children }) => (
  <tr onMouseEnter={e=>e.currentTarget.style.background=C.hover} onMouseLeave={e=>e.currentTarget.style.background='transparent'} style={{transition:'background 0.1s'}}>{children}</tr>
);

function Tabla({ children }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>{children}</table>
    </div>
  );
}

function Empty({ msg = 'Sin datos registrados aún.' }) {
  return <div style={{ padding:'40px 0', textAlign:'center', color:C.muted, fontSize:13 }}>{msg}</div>;
}

function ProgressBar({ value, max, color = C.accent }) {
  const p = Math.min((value/max)*100, 100);
  return (
    <div style={{ height:2, background:C.border, borderRadius:1, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${p}%`, background:color, transition:'width 0.6s ease' }} />
    </div>
  );
}

function BarChart({ data, height=130, color=C.accent, fmtVal=String }) {
  const [hov, setHov] = useState(null);
  const max = Math.max(...data.map(d=>d.value||0), 1);
  return (
    <div style={{ position:'relative', height, userSelect:'none' }} aria-hidden>
      <div style={{ display:'flex', alignItems:'flex-end', height:'100%', gap:2, paddingBottom:20 }}>
        {data.map((d,i)=>{
          const p=(Math.max(d.value||0,0)/max)*100;
          const isH=hov===i;
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end', position:'relative' }}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
              {isH&&d.value>0&&(
                <div style={{ position:'absolute', bottom:'100%', left:'50%', transform:'translateX(-50%)', background:C.surface, border:`1px solid ${C.border}`, color:C.text, fontSize:11, padding:'3px 8px', borderRadius:3, whiteSpace:'nowrap', marginBottom:4, pointerEvents:'none', zIndex:10 }}>
                  {fmtVal(d.value)}
                </div>
              )}
              <div style={{ width:'100%', borderRadius:'2px 2px 0 0', height:d.value>0?`${Math.max(p,1.5)}%`:'2px', background:isH?'#ff4040':color, opacity:isH?1:0.72, transition:'opacity 0.1s' }} />
              <div style={{ fontSize:10, color:C.muted, marginTop:4, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%' }}>{d.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position:'absolute', bottom:20, left:0, right:0, height:1, background:C.border }} />
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }} aria-hidden>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {[...Array(4)].map((_,i)=><div key={i} style={{ height:80, border:`1px solid ${C.border}`, borderRadius:6, background:C.surface, animation:'pulse 1.5s ease-in-out infinite' }} />)}
      </div>
      {[200,160,240].map((h,i)=><div key={i} style={{ height:h, border:`1px solid ${C.border}`, borderRadius:6, background:C.surface, animation:'pulse 1.5s ease-in-out infinite' }} />)}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────
function Header({ config, resumen, lastUpdated, refreshing, onRefresh }) {
  return (
    <header style={{ borderBottom:`1px solid ${C.border}`, padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
      <div>
        <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:C.muted, marginBottom:3 }}>PedidosYa · Tucumán</div>
        <div style={{ fontSize:17, fontWeight:600, color:C.text }}>{config?.nombre_cadete||'Nicolás Acosta'}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:C.muted, marginBottom:2 }}>Meta mensual</div>
          <div style={{ fontSize:15, fontWeight:600, fontVariantNumeric:'tabular-nums', color:C.text }}>{pesos(resumen?.metaMensual||600000)}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
          <button onClick={onRefresh} disabled={refreshing} style={{ background:'transparent', border:`1px solid ${C.border}`, color:refreshing?C.dim:C.muted, padding:'6px 12px', borderRadius:4, fontSize:12, cursor:refreshing?'default':'pointer', fontFamily:'inherit' }}>
            {refreshing?'Actualizando…':'Actualizar'}
          </button>
          {lastUpdated&&<span style={{ fontSize:10, color:C.dim }}>{fmtActualizacion(lastUpdated)}</span>}
        </div>
      </div>
    </header>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────
const TABS = [
  {id:'resumen',      label:'Resumen'},
  {id:'semanas',      label:'Semanas'},
  {id:'meses',        label:'Meses'},
  {id:'eficiencia',   label:'Eficiencia'},
  {id:'gastos',       label:'Gastos'},
  {id:'proyecciones', label:'Proyecciones'},
  {id:'guia',         label:'Guía'},
];

function NavTabs({ active, setActive }) {
  return (
    <nav style={{ borderBottom:`1px solid ${C.border}`, padding:'0 32px', display:'flex', overflowX:'auto' }} aria-label="Secciones">
      {TABS.map(t=>(
        <button key={t.id} onClick={()=>setActive(t.id)}
          aria-current={active===t.id?'page':undefined}
          style={{ padding:'13px 14px', background:'transparent', border:'none', borderBottom:`2px solid ${active===t.id?C.accent:'transparent'}`, color:active===t.id?C.text:C.muted, fontSize:13, fontWeight:active===t.id?500:400, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.1s', fontFamily:'inherit' }}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// ── Sección Resumen ────────────────────────────────────────────────────────
function SectionResumen({ resumen, registroDiario }) {
  const r = resumen||{};
  const meta = r.metaMensual||600000;
  const hoy = new Date();
  const mesActual = hoy.toISOString().slice(0,7);
  const diasEnMes = new Date(hoy.getFullYear(),hoy.getMonth()+1,0).getDate();
  const diasRestantes = diasEnMes - hoy.getDate();
  const regsActual = (registroDiario||[]).filter(x=>x.fecha&&x.fecha.startsWith(mesActual));
  const ganMes = regsActual.reduce((a,x)=>a+(x.gananciaReal||0),0);
  const diasTrabMes = regsActual.filter(x=>x.gananciaReal!=null).length;
  const promDiaMes = diasTrabMes>0 ? ganMes/diasTrabMes : 0;
  const proyeccion = ganMes + promDiaMes*diasRestantes;
  const rd = registroDiario||[];
  const ultimos14 = [...rd].slice(0,14).reverse();

  return (
    <div>
      <Section title="Acumulado total">
        <SGrid>
          <Stat label="Ganancia total"     value={pesos(r.gananciaTotal)}  color={C.green}  />
          <Stat label="Días trabajados"    value={r.diasTrabajados??'—'}               />
          <Stat label="Total pedidos"      value={r.pedidosTotal!=null?r.pedidosTotal.toLocaleString('es-AR'):'—'} />
          <Stat label="Horas en calle"     value={r.horasTotal!=null?r.horasTotal+' hs':'—'} />
          <Stat label="Total gastos"       value={pesos(r.gastosTotal)}    color="#dc2626" />
          <Stat label="Prom. ganancia/día" value={pesos(r.gananciaPromDia)}               />
          <Stat label="$ por hora"         value={pesos(r.xHoraPromedio)}                />
          <Stat label="$ por pedido"       value={pesos(r.xPedidoPromedio)}               />
        </SGrid>
      </Section>

      <Section title={`Mes actual — ${fmtMes(mesActual)}`}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, marginBottom:20 }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:C.muted }}>Acumulado</span>
              <span style={{ fontSize:13, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{pesos(ganMes)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:13, color:C.muted }}>Meta</span>
              <span style={{ fontSize:13, color:C.muted }}>{pesos(meta)}</span>
            </div>
            <ProgressBar value={ganMes} max={meta} color={ganMes>=meta?C.green:C.accent} />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
              <span style={{ fontSize:11, color:C.muted }}>{((ganMes/meta)*100).toFixed(1)}%</span>
              <span style={{ fontSize:11, color:C.muted }}>{diasRestantes} días restantes</span>
            </div>
          </div>
          <SGrid cols="1fr 1fr">
            <Stat label="Días este mes"  value={diasTrabMes} />
            <Stat label="Prom. diario"   value={pesos(promDiaMes>0?promDiaMes:null)} />
            <Stat label="Proyección"     value={pesos(promDiaMes>0?proyeccion:null)} color={proyeccion>=meta?C.green:C.amber} />
            <Stat label="Falta"          value={pesos(Math.max(0,meta-ganMes))} color={meta-ganMes<=0?C.green:C.text} />
          </SGrid>
        </div>
      </Section>

      {ultimos14.length>0&&(
        <Section title="Ganancia real — últimos 14 días">
          <BarChart height={140} data={ultimos14.map(r=>({ label:r.fecha?r.fecha.slice(5):'—', value:r.gananciaReal||0 }))} fmtVal={pesos} />
        </Section>
      )}

      {rd.length>0&&(
        <Section title="Registros recientes">
          <Tabla>
            <thead><tr>
              <TH>Fecha</TH><TH>Día</TH><TH right>Generado</TH><TH right>Gastos</TH>
              <TH right>Ganancia real</TH><TH right>Pedidos</TH><TH right>Horas</TH><TH right>$/hora</TH>
            </tr></thead>
            <tbody>
              {rd.slice(0,10).map((r,i)=>(
                <TR key={i}>
                  <TD bold>{fmtFecha(r.fecha)}</TD>
                  <TD muted>{r.dia||'—'}</TD>
                  <TD right>{pesos(r.totalGenerado)}</TD>
                  <TD right color="#dc2626">{pesos(r.totalGastos)}</TD>
                  <TD right bold color={(r.gananciaReal||0)>=(resumen?.metaDiaria||20000)?C.green:C.text}>{pesos(r.gananciaReal)}</TD>
                  <TD right>{r.pedidos??'—'}</TD>
                  <TD right muted>{r.horas!=null?r.horas+' hs':'—'}</TD>
                  <TD right muted>{pesos(r.xHora)}</TD>
                </TR>
              ))}
            </tbody>
          </Tabla>
        </Section>
      )}

      <Section title="Cómo se calcula la ganancia real">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:10 }}>
          {[
            ['Saldo inicial/día','$50.000 fijo por turno'],
            ['Total generado','Lo que generaste en la app'],
            ['Total del día','Saldo inicial + Total generado'],
            ['Ganancia real','Total del día − nafta − comida − otros'],
          ].map(([k,v])=>(
            <div key={k} style={{ padding:'14px', border:`1px solid ${C.border}`, borderRadius:6 }}>
              <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', color:C.muted, marginBottom:5 }}>{k}</div>
              <div style={{ fontSize:13, color:C.text }}>{v}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Sección Semanas ────────────────────────────────────────────────────────
function SectionSemanas({ resumenSemanal }) {
  const sem = resumenSemanal||[];
  if (!sem.length) return <Empty msg="No hay semanas con datos registrados aún." />;
  const mejor = sem.reduce((a,b)=>b.ganancia>a.ganancia?b:a, sem[0]);
  const promSem = Math.round(sem.reduce((a,s)=>a+s.ganancia,0)/sem.length);
  const ultimas8 = [...sem].slice(0,8).reverse();

  return (
    <div>
      <Section title="Resumen semanal">
        <SGrid>
          <Stat label="Semanas registradas" value={sem.length} />
          <Stat label="Promedio semanal"    value={pesos(promSem)} />
          <Stat label="Mejor semana"        value={pesos(mejor.ganancia)} color={C.green} />
          <Stat label="Período mejor sem."  value={`${fmtFecha(mejor.monday).slice(0,5)} al ${fmtFecha(mejor.sunday).slice(0,5)}`} />
        </SGrid>
      </Section>

      {ultimas8.length>1&&(
        <Section title="Ganancia por semana — últimas 8">
          <BarChart height={140} data={ultimas8.map(s=>({ label:fmtFecha(s.monday).slice(0,5), value:s.ganancia }))} fmtVal={pesos} />
        </Section>
      )}

      <Section title="Detalle por semana">
        <Tabla>
          <thead><tr>
            <TH>Semana (lunes)</TH><TH>Hasta (domingo)</TH>
            <TH right>Días</TH><TH right>Ganancia</TH><TH right>Prom/día</TH>
            <TH right>Pedidos</TH><TH right>Horas</TH><TH right>$/hora</TH><TH right>Gastos</TH>
          </tr></thead>
          <tbody>
            {sem.map((s,i)=>(
              <TR key={i}>
                <TD bold>{fmtFecha(s.monday)}</TD>
                <TD muted>{fmtFecha(s.sunday)}</TD>
                <TD right>{s.dias}</TD>
                <TD right bold color={s.ganancia===mejor.ganancia?C.green:C.text}>{pesos(s.ganancia)}</TD>
                <TD right>{pesos(s.promDia)}</TD>
                <TD right>{s.pedidos||'—'}</TD>
                <TD right muted>{s.horas?s.horas+' hs':'—'}</TD>
                <TD right muted>{s.xHora?pesos(s.xHora):'—'}</TD>
                <TD right color="#dc2626">{pesos(s.gastos)}</TD>
              </TR>
            ))}
          </tbody>
        </Tabla>
      </Section>

      {sem.length>=2&&(
        <Section title="Variación semana a semana (WoW)">
          <Tabla>
            <thead><tr>
              <TH>Semana</TH><TH right>Ganancia</TH><TH right>Variación</TH>
              <TH right>Pedidos</TH><TH right>Variación</TH><TH right>Gastos</TH>
            </tr></thead>
            <tbody>
              {sem.slice(0,-1).map((s,i)=>{
                const prev=sem[i+1];
                const gDiff=prev.ganancia>0?((s.ganancia-prev.ganancia)/prev.ganancia)*100:null;
                const pDiff=prev.pedidos>0?((s.pedidos-prev.pedidos)/prev.pedidos)*100:null;
                return (
                  <TR key={i}>
                    <TD>{fmtFecha(s.monday)}</TD>
                    <TD right bold>{pesos(s.ganancia)}</TD>
                    <TD right color={gDiff==null?C.muted:gDiff>=0?C.green:'#dc2626'}>
                      {gDiff==null?'—':(gDiff>=0?'+':'')+gDiff.toFixed(1)+'%'}
                    </TD>
                    <TD right>{s.pedidos||'—'}</TD>
                    <TD right color={pDiff==null?C.muted:pDiff>=0?C.green:'#dc2626'}>
                      {pDiff==null?'—':(pDiff>=0?'+':'')+pDiff.toFixed(1)+'%'}
                    </TD>
                    <TD right color="#dc2626">{pesos(s.gastos)}</TD>
                  </TR>
                );
              })}
            </tbody>
          </Tabla>
        </Section>
      )}
    </div>
  );
}

// ── Sección Meses ──────────────────────────────────────────────────────────
function SectionMeses({ resumenMensual, resumen }) {
  const meses = resumenMensual||[];
  if (!meses.length) return <Empty msg="No hay meses con datos registrados aún." />;
  const mejor = meses.reduce((a,b)=>b.ganancia>a.ganancia?b:a, meses[0]);
  const promMen = Math.round(meses.reduce((a,m)=>a+m.ganancia,0)/meses.length);
  const meta = resumen?.metaMensual||600000;

  return (
    <div>
      <Section title="Resumen mensual">
        <SGrid>
          <Stat label="Meses registrados"  value={meses.length} />
          <Stat label="Promedio mensual"   value={pesos(promMen)} />
          <Stat label="Mejor mes"          value={pesos(mejor.ganancia)} color={C.green} />
          <Stat label="Mejor mes (período)"value={mejor.label} />
          <Stat label="Meta mensual"       value={pesos(meta)} />
          <Stat label="Meses sobre meta"   value={meses.filter(m=>m.ganancia>=meta).length} color={C.green} />
        </SGrid>
      </Section>

      {meses.length>1&&(
        <Section title="Ganancia por mes">
          <BarChart height={140} data={[...meses].reverse().map(m=>({ label:m.label.slice(0,3), value:m.ganancia }))} fmtVal={pesos} />
        </Section>
      )}

      <Section title="Detalle por mes">
        <Tabla>
          <thead><tr>
            <TH>Mes</TH><TH right>Días</TH><TH right>Ganancia</TH><TH right>vs meta</TH>
            <TH right>Prom/día</TH><TH right>Pedidos</TH><TH right>Horas</TH>
            <TH right>Gastos</TH><TH right>Nafta</TH><TH right>Comida</TH><TH right>Otros</TH>
          </tr></thead>
          <tbody>
            {meses.map((m,i)=>{
              const p=((m.ganancia/meta)*100).toFixed(1);
              const ok=m.ganancia>=meta;
              return (
                <TR key={i}>
                  <TD bold>{m.label}</TD>
                  <TD right>{m.dias}</TD>
                  <TD right bold color={ok?C.green:C.text}>{pesos(m.ganancia)}</TD>
                  <TD right color={ok?C.green:'#dc2626'}>{p}%</TD>
                  <TD right>{pesos(m.promDia)}</TD>
                  <TD right>{m.pedidos||'—'}</TD>
                  <TD right muted>{m.horas?m.horas+' hs':'—'}</TD>
                  <TD right color="#dc2626">{pesos(m.gastos)}</TD>
                  <TD right muted>{pesos(m.nafta||null)}</TD>
                  <TD right muted>{pesos(m.comida||null)}</TD>
                  <TD right muted>{pesos(m.otros||null)}</TD>
                </TR>
              );
            })}
          </tbody>
        </Tabla>
      </Section>
    </div>
  );
}

// ── Sección Eficiencia ─────────────────────────────────────────────────────
function SectionEficiencia({ registroDiario }) {
  const rd = registroDiario||[];
  if (!rd.length) return <Empty />;
  const DIAS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const byDia={};  DIAS.forEach(d=>{byDia[d]=[];});
  const byClima={};
  const byEn={1:[],2:[],3:[],4:[],5:[]};

  rd.forEach(r=>{
    if(r.dia&&byDia[r.dia])byDia[r.dia].push(r);
    if(r.clima){if(!byClima[r.clima])byClima[r.clima]=[];byClima[r.clima].push(r);}
    if(r.energia&&byEn[r.energia])byEn[r.energia].push(r);
  });

  const avg=(arr,k)=>{const v=arr.map(x=>x[k]).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  const diaData=DIAS.map(d=>({dia:d,rows:byDia[d]}));
  const bestDia=diaData.filter(d=>d.rows.length>0).sort((a,b)=>(avg(b.rows,'gananciaReal')||0)-(avg(a.rows,'gananciaReal')||0))[0];

  return (
    <div>
      {bestDia&&(
        <Section title="Destacados">
          <SGrid>
            <Stat label="Mejor día de semana"    value={bestDia.dia} color={C.green} />
            <Stat label="Ganancia prom. ese día"  value={pesos(avg(bestDia.rows,'gananciaReal'))} color={C.green} />
            <Stat label="Días analizados"         value={rd.length} />
            <Stat label="Días con clima registrado" value={rd.filter(r=>r.clima).length} />
          </SGrid>
        </Section>
      )}

      <Section title="Por día de semana">
        <div style={{marginBottom:20}}>
          <BarChart height={130} data={diaData.map(d=>({ label:d.dia.slice(0,3), value:avg(d.rows,'gananciaReal')||0 }))} fmtVal={pesos} />
        </div>
        <Tabla>
          <thead><tr>
            <TH>Día</TH><TH right>Días trab.</TH><TH right>Gan. prom.</TH>
            <TH right>Pedidos prom.</TH><TH right>KM prom.</TH><TH right>Horas prom.</TH><TH right>$/hora prom.</TH>
          </tr></thead>
          <tbody>
            {diaData.map(({dia,rows},i)=>{
              const g=avg(rows,'gananciaReal');
              const ok=bestDia&&dia===bestDia.dia;
              return (
                <TR key={i}>
                  <TD bold color={ok?C.green:undefined}>{dia}</TD>
                  <TD right>{rows.length||'—'}</TD>
                  <TD right color={ok?C.green:undefined}>{pesos(g)}</TD>
                  <TD right>{avg(rows,'pedidos')?.toFixed(1)??'—'}</TD>
                  <TD right muted>{avg(rows,'km')?.toFixed(1)??'—'}</TD>
                  <TD right muted>{avg(rows,'horas')?.toFixed(1)??'—'}</TD>
                  <TD right muted>{pesos(avg(rows,'xHora'))}</TD>
                </TR>
              );
            })}
          </tbody>
        </Tabla>
      </Section>

      {Object.keys(byClima).length>0&&(
        <Section title="Por condición climática">
          <div style={{marginBottom:20}}>
            <BarChart height={120} color={C.blue} data={Object.entries(byClima).map(([c,rows])=>({ label:c.slice(0,4), value:avg(rows,'gananciaReal')||0 }))} fmtVal={pesos} />
          </div>
          <Tabla>
            <thead><tr><TH>Clima</TH><TH right>Días</TH><TH right>Gan. prom.</TH><TH right>Pedidos prom.</TH><TH right>KM prom.</TH><TH right>Gastos prom.</TH></tr></thead>
            <tbody>
              {Object.entries(byClima).sort((a,b)=>(avg(b[1],'gananciaReal')||0)-(avg(a[1],'gananciaReal')||0)).map(([c,rows],i)=>(
                <TR key={i}><TD bold>{c}</TD><TD right>{rows.length}</TD><TD right>{pesos(avg(rows,'gananciaReal'))}</TD><TD right>{avg(rows,'pedidos')?.toFixed(1)??'—'}</TD><TD right muted>{avg(rows,'km')?.toFixed(1)??'—'}</TD><TD right color="#dc2626">{pesos(avg(rows,'totalGastos'))}</TD></TR>
              ))}
            </tbody>
          </Tabla>
        </Section>
      )}

      <Section title="Por nivel de energía (1=bajo, 5=excelente)">
        <div style={{marginBottom:20}}>
          <BarChart height={120} color={C.amber} data={[1,2,3,4,5].map(e=>({ label:`Niv. ${e}`, value:avg(byEn[e],'gananciaReal')||0 }))} fmtVal={pesos} />
        </div>
        <Tabla>
          <thead><tr><TH>Energía</TH><TH right>Días</TH><TH right>Gan. prom.</TH><TH right>Pedidos prom.</TH><TH right>KM prom.</TH><TH right>Horas prom.</TH></tr></thead>
          <tbody>
            {[1,2,3,4,5].map(e=>{
              const rows=byEn[e];
              const labels=['','Muy bajo','Bajo','Normal','Bueno','Excelente'];
              return (
                <TR key={e}><TD>{e} — {labels[e]}</TD><TD right>{rows.length||'—'}</TD><TD right>{pesos(avg(rows,'gananciaReal'))}</TD><TD right>{avg(rows,'pedidos')?.toFixed(1)??'—'}</TD><TD right muted>{avg(rows,'km')?.toFixed(1)??'—'}</TD><TD right muted>{avg(rows,'horas')?.toFixed(1)??'—'}</TD></TR>
              );
            })}
          </tbody>
        </Tabla>
      </Section>

      {rd.length>=5&&(
        <Section title="Top 10 días con mayor ganancia">
          <Tabla>
            <thead><tr><TH>Fecha</TH><TH>Día</TH><TH>Clima</TH><TH right>Energía</TH><TH right>Pedidos</TH><TH right>Horas</TH><TH right>Ganancia real</TH></tr></thead>
            <tbody>
              {[...rd].sort((a,b)=>(b.gananciaReal||0)-(a.gananciaReal||0)).slice(0,10).map((r,i)=>(
                <TR key={i}><TD bold>{fmtFecha(r.fecha)}</TD><TD muted>{r.dia||'—'}</TD><TD muted>{r.clima||'—'}</TD><TD right muted>{r.energia??'—'}</TD><TD right>{r.pedidos??'—'}</TD><TD right muted>{r.horas!=null?r.horas+' hs':'—'}</TD><TD right bold color={C.green}>{pesos(r.gananciaReal)}</TD></TR>
              ))}
            </tbody>
          </Tabla>
        </Section>
      )}

      {rd.length>=5&&(
        <Section title="Top 10 días con peor ganancia">
          <Tabla>
            <thead><tr><TH>Fecha</TH><TH>Día</TH><TH>Clima</TH><TH right>Energía</TH><TH right>Pedidos</TH><TH right>Horas</TH><TH right>Ganancia real</TH></tr></thead>
            <tbody>
              {[...rd].filter(r=>r.gananciaReal!=null).sort((a,b)=>(a.gananciaReal||0)-(b.gananciaReal||0)).slice(0,10).map((r,i)=>(
                <TR key={i}><TD bold>{fmtFecha(r.fecha)}</TD><TD muted>{r.dia||'—'}</TD><TD muted>{r.clima||'—'}</TD><TD right muted>{r.energia??'—'}</TD><TD right>{r.pedidos??'—'}</TD><TD right muted>{r.horas!=null?r.horas+' hs':'—'}</TD><TD right bold color="#dc2626">{pesos(r.gananciaReal)}</TD></TR>
              ))}
            </tbody>
          </Tabla>
        </Section>
      )}
    </div>
  );
}

// ── Sección Gastos ─────────────────────────────────────────────────────────
function SectionGastos({ registroDiario, gastosPorCategoria }) {
  const rd = registroDiario||[];
  const g  = gastosPorCategoria||{nafta:0,comida:0,otros:0};
  if (!rd.length) return <Empty />;

  const total    = g.nafta+g.comida+g.otros;
  const ganBruta = rd.reduce((a,r)=>a+(r.gananciaReal||0),0)+total;
  const pctG     = ganBruta>0?(total/ganBruta)*100:0;
  const kmTotal  = rd.reduce((a,r)=>a+(r.km||0),0);
  const cxKm     = kmTotal>0?g.nafta/kmTotal:null;
  const diasC    = rd.filter(r=>r.totalGastos!=null).length;
  const promDG   = diasC>0?total/diasC:0;

  function getMonday(iso){
    const d=new Date(iso+'T00:00:00'); const day=d.getDay(); const diff=day===0?-6:1-day; d.setDate(d.getDate()+diff); return d.toISOString().split('T')[0];
  }
  const byWeek={};
  rd.forEach(r=>{
    if(!r.fecha)return; const w=getMonday(r.fecha);
    if(!byWeek[w])byWeek[w]={nafta:0,comida:0,otros:0};
    byWeek[w].nafta+=r.nafta||0; byWeek[w].comida+=r.comida||0; byWeek[w].otros+=r.otros||0;
  });
  const weeklyG = Object.entries(byWeek).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,8).reverse()
    .map(([monday,v])=>({ label:fmtFecha(monday).slice(0,5), value:Math.round(v.nafta+v.comida+v.otros), nafta:Math.round(v.nafta), comida:Math.round(v.comida), otros:Math.round(v.otros) }));

  return (
    <div>
      <Section title="Resumen de gastos">
        <SGrid>
          <Stat label="Total gastos"       value={pesos(total)}           color="#dc2626" />
          <Stat label="Nafta"              value={pesos(g.nafta)}         color="#dc2626" />
          <Stat label="Comida"             value={pesos(g.comida)}        color={C.amber} />
          <Stat label="Otros"              value={pesos(g.otros)}                         />
          <Stat label="% del ingreso bruto" value={pctG.toFixed(1)+'%'}  color={pctG>25?'#dc2626':C.amber} />
          <Stat label="Costo por km"       value={cxKm!=null?pesos(Math.round(cxKm)):'—'} />
          <Stat label="Prom. gasto/día"    value={pesos(promDG)}                         />
          <Stat label="Días analizados"    value={diasC}                                  />
        </SGrid>

        <div style={{ border:`1px solid ${C.border}`, borderRadius:6, padding:'20px', marginBottom:16 }}>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:C.muted, marginBottom:18 }}>Distribución de gastos</div>
          {[['Nafta',g.nafta,'#dc2626'],['Comida',g.comida,C.amber],['Otros',g.otros,C.muted]].map(([label,value,color])=>{
            const p=total>0?(value/total)*100:0;
            return (
              <div key={label} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                  <span style={{fontSize:12,color:C.text}}>{label}</span>
                  <span style={{fontSize:12,fontVariantNumeric:'tabular-nums',color:C.muted}}>{pesos(value)} · {p.toFixed(1)}%</span>
                </div>
                <div style={{height:3,background:C.border,borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${p}%`,background:color,transition:'width 0.6s ease'}} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {weeklyG.length>1&&(
        <Section title="Gastos totales por semana — últimas 8">
          <BarChart height={130} color="#dc2626" data={weeklyG.map(w=>({label:w.label,value:w.value}))} fmtVal={pesos} />
        </Section>
      )}

      {weeklyG.length>0&&(
        <Section title="Desglose semanal de gastos">
          <Tabla>
            <thead><tr><TH>Semana</TH><TH right>Total</TH><TH right>Nafta</TH><TH right>Comida</TH><TH right>Otros</TH></tr></thead>
            <tbody>
              {[...weeklyG].reverse().map((w,i)=>(
                <TR key={i}><TD bold>{w.label}</TD><TD right bold color="#dc2626">{pesos(w.value)}</TD><TD right>{pesos(w.nafta)}</TD><TD right>{pesos(w.comida)}</TD><TD right>{pesos(w.otros)}</TD></TR>
              ))}
            </tbody>
          </Tabla>
        </Section>
      )}

      {rd.length>0&&(
        <Section title="Días con mayor gasto">
          <Tabla>
            <thead><tr><TH>Fecha</TH><TH>Día</TH><TH right>Nafta</TH><TH right>Comida</TH><TH right>Otros</TH><TH right>Total gastos</TH><TH right>Ganancia real</TH></tr></thead>
            <tbody>
              {[...rd].filter(r=>r.totalGastos!=null).sort((a,b)=>(b.totalGastos||0)-(a.totalGastos||0)).slice(0,10).map((r,i)=>(
                <TR key={i}><TD bold>{fmtFecha(r.fecha)}</TD><TD muted>{r.dia||'—'}</TD><TD right>{pesos(r.nafta)}</TD><TD right>{pesos(r.comida)}</TD><TD right>{pesos(r.otros)}</TD><TD right bold color="#dc2626">{pesos(r.totalGastos)}</TD><TD right>{pesos(r.gananciaReal)}</TD></TR>
              ))}
            </tbody>
          </Tabla>
        </Section>
      )}
    </div>
  );
}

// ── Sección Proyecciones ───────────────────────────────────────────────────
function SectionProyecciones({ registroDiario, resumen }) {
  const rd = registroDiario||[];
  const meta = resumen?.metaMensual||600000;
  const metaDia = resumen?.metaDiaria||20000;
  const hoy = new Date();
  const mesActual = hoy.toISOString().slice(0,7);
  const diasEnMes = new Date(hoy.getFullYear(),hoy.getMonth()+1,0).getDate();
  const diasRestantes = diasEnMes - hoy.getDate();
  const regsActual = rd.filter(r=>r.fecha&&r.fecha.startsWith(mesActual));
  const ganMes = regsActual.reduce((a,r)=>a+(r.gananciaReal||0),0);
  const diasTrab = regsActual.filter(r=>r.gananciaReal!=null).length;
  const promDia = diasTrab>0?ganMes/diasTrab:0;
  const proyeccion = ganMes+promDia*diasRestantes;
  const falta = Math.max(0,meta-ganMes);
  const diasNec = promDia>0?Math.ceil(falta/promDia):null;

  const escenarios=[
    {label:'5 días/sem.',  pct:5/7},
    {label:'6 días/sem.',  pct:6/7},
    {label:'7 días/sem.',  pct:1},
  ].map(esc=>({
    ...esc,
    diasDisp:Math.floor(diasRestantes*esc.pct),
    proyeccion:ganMes+promDia*Math.floor(diasRestantes*esc.pct),
    alcanza:ganMes+promDia*Math.floor(diasRestantes*esc.pct)>=meta,
  }));

  return (
    <div>
      <Section title={`Mes actual — ${fmtMes(mesActual)}`}>
        <SGrid>
          <Stat label="Ganado hasta hoy"   value={pesos(ganMes)}                       color={ganMes>=meta*0.5?C.green:C.text} />
          <Stat label="Falta para la meta" value={pesos(falta)}                        color={falta>0?'#dc2626':C.green} />
          <Stat label="Prom. diario (mes)" value={pesos(promDia>0?promDia:null)}       />
          <Stat label="Proyección a fin"   value={pesos(promDia>0?proyeccion:null)}    color={proyeccion>=meta?C.green:C.amber} />
          <Stat label="Días trabajados"    value={diasTrab}                            />
          <Stat label="Días restantes"     value={diasRestantes}                       />
          <Stat label="Días aún necesarios" value={diasNec!=null?`${Math.min(diasNec,diasRestantes)}`:'—'} />
          <Stat label="Meta diaria"        value={pesos(metaDia)}                      />
        </SGrid>
        <ProgressBar value={ganMes} max={meta} color={ganMes>=meta?C.green:C.accent} />
        <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
          <span style={{fontSize:11,color:C.muted}}>{((ganMes/meta)*100).toFixed(1)}% alcanzado</span>
          <span style={{fontSize:11,color:C.muted}}>{fmtMes(mesActual)}</span>
        </div>
      </Section>

      <Section title="Escenarios para los días restantes">
        <Tabla>
          <thead><tr><TH>Escenario</TH><TH right>Días disponibles</TH><TH right>Proyección</TH><TH right>¿Alcanza meta?</TH><TH right>Diferencia vs meta</TH></tr></thead>
          <tbody>
            {escenarios.map((esc,i)=>(
              <TR key={i}>
                <TD bold>{esc.label}</TD>
                <TD right muted>{esc.diasDisp}</TD>
                <TD right bold color={esc.alcanza?C.green:C.amber}>{pesos(esc.proyeccion)}</TD>
                <TD right color={esc.alcanza?C.green:'#dc2626'}>{esc.alcanza?'Sí':'No'}</TD>
                <TD right color={esc.proyeccion-meta>=0?C.green:'#dc2626'}>{esc.proyeccion-meta>=0?'+':''}{pesos(esc.proyeccion-meta)}</TD>
              </TR>
            ))}
          </tbody>
        </Tabla>
        {promDia===0&&<div style={{marginTop:10,fontSize:12,color:C.muted}}>Sin datos del mes actual — no se puede proyectar.</div>}
        {promDia>0&&<div style={{marginTop:10,padding:'10px 14px',border:`1px solid ${C.border}`,borderRadius:4,fontSize:12,color:C.muted}}>Proyecciones basadas en promedio de {pesos(promDia)}/día (mes actual).</div>}
      </Section>

      <Section title="Indicadores completos">
        <Tabla>
          <thead><tr><TH>Indicador</TH><TH right>Valor</TH><TH>Detalle</TH></tr></thead>
          <tbody>
            {[
              ['Días trabajados este mes', diasTrab, 'Días con ganancia registrada'],
              ['Ganancia acumulada', pesos(ganMes), 'Suma del mes actual'],
              ['Promedio ganancia/día', pesos(promDia>0?promDia:null), 'Diario promedio del mes actual'],
              ['Proyección fin de mes', pesos(promDia>0?proyeccion:null), 'Manteniendo el ritmo actual'],
              ['Meta mensual', pesos(meta), ''],
              ['Avance sobre la meta', pct((ganMes/meta)*100), ''],
              ['Días restantes', diasRestantes, 'Hasta fin del mes'],
              ['Días necesarios para meta', diasNec!=null?Math.min(diasNec,diasRestantes):'—', 'A ritmo actual'],
              ['Falta ganar', pesos(falta), 'Para alcanzar la meta'],
            ].map(([ind,val,det])=>(
              <TR key={ind}><TD>{ind}</TD><TD right bold>{val}</TD><TD muted>{det}</TD></TR>
            ))}
          </tbody>
        </Tabla>
      </Section>
    </div>
  );
}

// ── Sección Guía ──────────────────────────────────────────────────────────
function SectionGuia() {
  const [sub, setSub] = useState('nico');
  const [faqOpen, setFaqOpen] = useState(null);
  const subTabs=[{id:'nico',label:'Para Nicolás'},{id:'emilia',label:'Para Emilia'},{id:'datos',label:'Por qué registrar'},{id:'faq',label:'Preguntas frecuentes'}];

  const EmailCard = ({tag,title,freq,desc,items}) => (
    <div style={{border:`1px solid ${C.border}`,borderRadius:6,marginBottom:12,overflow:'hidden'}}>
      <div style={{padding:'16px 18px',borderBottom:`1px solid ${C.border}`,background:C.surface}}>
        <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',color:C.muted,marginBottom:4}}>{tag}</div>
        <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:2}}>{title}</div>
        <div style={{fontSize:11,color:C.muted}}>{freq}</div>
      </div>
      <div style={{padding:'16px 18px'}}>
        <p style={{fontSize:13,color:C.muted,marginBottom:14,lineHeight:1.7}}>{desc}</p>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {items.map((it,i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:4}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:it.color||C.accent,marginTop:4,flexShrink:0}} />
              <div><div style={{fontSize:12,fontWeight:500,color:C.text,marginBottom:2}}>{it.title}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{it.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Scenario = ({title,children}) => (
    <div style={{border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.accent}`,borderRadius:4,padding:'14px 16px',marginBottom:10}}>
      <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.7}}>{children}</div>
    </div>
  );

  const Tag = ({children,color}) => <span style={{display:'inline-block',background:color+'20',color,fontVariantNumeric:'tabular-nums',fontSize:11,fontWeight:500,padding:'1px 6px',borderRadius:3}}>{children}</span>;

  const faqs=[
    {q:'¿Cuándo llegan los correos?',a:'Todos los correos son semanales y automáticos. Se envían el lunes a la mañana con los datos de la semana anterior. No hay que hacer nada — siempre que haya datos cargados, los correos llegan solos.'},
    {q:'¿Qué pasa si una semana no trabajé?',a:'El sistema envía el correo igual, pero con los totales en cero. Los promedios históricos toman en cuenta solo las semanas con datos reales, así que una semana sin datos no arruina los análisis anteriores.'},
    {q:'¿Qué hago si veo un número que me parece incorrecto?',a:'Primero revisá la planilla de Google Sheets para ese período. El correo muestra exactamente lo que está cargado. Si hay un error, corregís el dato en la planilla y el próximo correo ya va a reflejar la corrección.'},
    {q:'¿Por qué algunas filas del correo muestran $0?',a:'Significa que esa semana no hubo registros con ese dato. Es correcto, no es un error.'},
    {q:'¿Qué significa el nivel de energía y cómo lo elijo?',a:'Es una escala del 1 al 5 que completás al registrar el turno, según cómo te sentiste: 1 = muy cansado, 3 = día normal, 5 = con toda la energía. No hay respuesta correcta — solo importa que sea honesto.'},
    {q:'¿Por qué Emilia recibe correos de los turnos de Nico?',a:'Porque la economía del hogar depende del trabajo de Nico, y la transparencia fortalece la planificación familiar. Emilia recibe versiones adaptadas — no todos los datos técnicos, sino los que le permiten planificar gastos.'},
    {q:'¿Cuánto tiempo hay que usar el sistema para que los datos sean útiles?',a:'Los primeros correos ya muestran datos útiles desde la primera semana. Pero los análisis más valiosos necesitan al menos 3 o 4 semanas de datos para ser confiables.'},
    {q:'¿Qué pasa si me olvido de registrar datos de un día?',a:'Podés cargarlos después — la planilla acepta entradas con fechas pasadas. Lo ideal es hacerlo antes del lunes para que el correo de esa semana ya los incluya.'},
    {q:'¿Puedo pedir que se cambie algo en los correos?',a:'Sí. Los correos son configurables. Si una sección no es útil, si querés agregar un tipo de análisis, o si el lenguaje de alguna parte no se entiende, podés pedirle al administrador del sistema que lo modifique.'},
  ];

  return (
    <div>
      <div style={{display:'flex',gap:4,marginBottom:24,overflowX:'auto',paddingBottom:4}}>
        {subTabs.map(t=>(
          <button key={t.id} onClick={()=>setSub(t.id)} style={{ padding:'7px 14px', background:'transparent', border:`1px solid ${sub===t.id?C.accent:C.border}`, borderRadius:4, color:sub===t.id?C.text:C.muted, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {sub==='nico'&&(
        <div>
          <Section title="Correos semanales para Nicolás">
            <SGrid cols="repeat(3,1fr)">
              <Stat label="Correos/semana" value="3" color={C.accent} />
              <Stat label="Métricas" value="20+" />
              <Stat label="Automáticos" value="100%" />
            </SGrid>
          </Section>
          <EmailCard tag="Solo para Nicolás" title="Análisis de eficiencia semanal" freq="Semanal · Todos los lunes" desc="El correo más completo. Analiza patrones de trabajo para identificar cuándo, en qué condiciones y bajo qué circunstancias ganás más." items={[
            {title:'Rendimiento por día de semana',desc:'Gráfico de barras con ganancia por día. Detecta automáticamente tu mejor y peor día.',color:C.accent},
            {title:'Rendimiento histórico diario',desc:'Tabla con ganancia promedio y pedidos por día de la semana a lo largo del tiempo.',color:C.green},
            {title:'Impacto del clima',desc:'Compara ganancia y pedidos según el clima registrado: Soleado, Nublado, Lluvia, Tormenta.',color:C.amber},
            {title:'Nivel de energía vs ganancia',desc:'Cruza el nivel de energía que declaraste (1 a 5) con tu ganancia real en números concretos.',color:C.blue},
            {title:'Insights accionables',desc:'3 o 4 recomendaciones derivadas de tus propios datos de esa semana. No son consejos genéricos.',color:C.muted},
          ]} />
          <EmailCard tag="Solo para Nicolás" title="Reporte mensual" freq="Semanal · Con el de eficiencia" desc="Mira hacia adelante y hacia atrás: muestra cómo vas en el mes actual y proyecta cuánto podrías cerrar si seguís al ritmo actual." items={[
            {title:'Desempeño gráfico',desc:'Gráfico de rendimiento semanal. Permite ver si estás en una tendencia ascendente o descendente.',color:C.accent},
            {title:'Proyección del ingreso mensual',desc:'Estimación del cierre de mes si mantenés el ritmo. Base para planificar gastos del hogar.',color:C.green},
          ]} />
          <EmailCard tag="Solo para Nicolás" title="Estado de tu moto" freq="Semanal · Resumen de mantenimiento" desc="Tu moto es tu herramienta de trabajo. Este correo registra todos los gastos de mantenimiento y los compara con tu ganancia." items={[
            {title:'Estado del mantenimiento',desc:'Lista todos los gastos de la moto registrados en la semana: nafta, aceite, reparaciones.',color:C.amber},
            {title:'Deducción sobre ganancia',desc:'Calcula qué porcentaje de tu ganancia bruta se fue en mantenimiento.',color:'#dc2626'},
            {title:'Previsión de fondos',desc:'Proyección de cuánto queda disponible después de descontar los gastos de la moto.',color:C.green},
          ]} />
        </div>
      )}

      {sub==='emilia'&&(
        <div>
          <Section title="Correos semanales para Emilia">
            <div style={{padding:'14px 16px',border:`1px solid ${C.border}`,borderRadius:4,fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.7}}>
              Recibís correos diseñados específicamente para vos — resúmenes financieros del hogar con lenguaje claro, sin jerga técnica. La idea es que puedas planificar los gastos del mes con información real y actualizada cada semana.
            </div>
          </Section>
          <EmailCard tag="Solo para Emilia" title="Eficiencia de Nico (versión simplificada)" freq="Semanal · Versión adaptada del análisis" desc="Es la versión del análisis de eficiencia adaptada para que lo entiendas sin ser del rubro. Te muestra lo más importante: cuánto ganó Nico, cuáles fueron sus mejores momentos y qué factores influyeron." items={[
            {title:'Resumen de la semana',desc:'Ganancia total, pedidos totales y promedio diario. Los tres números clave para entender la semana.',color:C.blue},
            {title:'Mejor y peor momento',desc:'Te indica en qué día y horario Nico rindió mejor. Útil para planificar actividades familiares.',color:C.green},
            {title:'Factores que afectaron el desempeño',desc:'Resumen del impacto del clima y la energía personal.',color:C.amber},
          ]} />
          <EmailCard tag="Solo para Emilia" title="Gastos de la moto" freq="Semanal · Resumen financiero del hogar" desc="El correo más importante para la economía del hogar. Muestra cuánto se gastó en la moto esa semana y cuánto dinero queda disponible para el hogar." items={[
            {title:'Detalle de gastos',desc:'Lista de cada gasto registrado en la moto con fecha y monto. Transparencia total.',color:C.amber},
            {title:'Deducción sobre ganancia',desc:'El porcentaje de la ganancia bruta que se fue en mantenimiento.',color:'#dc2626'},
            {title:'Previsión de fondos del hogar',desc:'La ganancia neta estimada disponible para el hogar. El número con el que planificar el mes.',color:C.green},
          ]} />
          <Scenario title="Ejemplo: Emilia planifica los gastos del mes">
            Emilia recibe el lunes el correo. Ve que Nico ganó <Tag color={C.green}>$320.000 brutos</Tag> esa semana, pero hubo un gasto de <Tag color="#dc2626">$45.000 en neumáticos</Tag>. Le quedan disponibles <Tag color={C.green}>$275.000 netos</Tag>.<br/><br/>Con ese dato puede decidir cuánto destinar al supermercado sin esperar que Nico cuente el efectivo.
          </Scenario>
        </div>
      )}

      {sub==='datos'&&(
        <div>
          <Section title="Por qué registrar cada dato">
            <div style={{padding:'14px 16px',border:`1px solid ${C.border}`,borderRadius:4,fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.7}}>
              El sistema solo puede analizar lo que existe. Si no registrás el clima, la columna de clima aparece vacía. <strong style={{color:C.text}}>Cada campo que no completás es un análisis que no podés leer.</strong>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10,marginBottom:24}}>
              {[
                {label:'Fecha',val:'El día del turno',why:'Permite separar por día de semana y calcular totales semanales/mensuales.'},
                {label:'Ganancia',val:'Monto en pesos',why:'El número más importante. Sin él, ningún análisis financiero es posible.'},
                {label:'Pedidos',val:'Cantidad',why:'Permite calcular ganancia por pedido y detectar si bajan los pedidos o el valor de cada uno.'},
                {label:'Clima',val:'Soleado/Nublado/Lluvia/Tormenta',why:'Sin este dato, la tabla de Impacto del Clima no puede mostrarte si la lluvia te beneficia.'},
                {label:'Nivel de energía',val:'Del 1 al 5',why:'Revela si hay correlación entre cómo te sentís y cuánto rendís.'},
                {label:'KM recorridos',val:'Kilómetros del turno',why:'Permite calcular el costo por kilómetro y la eficiencia de nafta.'},
              ].map((d,i)=>(
                <div key={i} style={{padding:'14px',border:`1px solid ${C.border}`,borderRadius:4}}>
                  <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.08em',color:C.muted,marginBottom:4}}>{d.label}</div>
                  <div style={{fontSize:13,fontWeight:500,color:C.text,marginBottom:6}}>{d.val}</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{d.why}</div>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Escenarios de ejemplo">
            <Scenario title="¿Me conviene salir cuando llueve?">
              Después de 4 semanas registrando el clima, el correo muestra: <Tag color="#dc2626">Lluvia: 18 pedidos · $11.500/pedido</Tag> vs <Tag color={C.green}>Soleado: 12 pedidos · $13.200/pedido</Tag>.<br/><br/>Con ese dato podés decidir si salir en lluvia es una elección personal, no económica.
            </Scenario>
            <Scenario title="Los viernes me parece que rindo mejor">
              El correo muestra: <Tag color={C.green}>Viernes: $145.000 promedio</Tag> vs <Tag color="#dc2626">Miércoles: $67.000 promedio</Tag>. Ahora puede decidir más horas los viernes, y tomarse los miércoles tranquilo sin culpa.
            </Scenario>
            <Scenario title="La moto come demasiado del sueldo">
              Emilia nota que la deducción fue del <Tag color="#dc2626">28%</Tag> cuando normalmente es del 10-12%. Pueden charlar sobre armar un fondo de mantenimiento mensual.
            </Scenario>
            <Scenario title="La energía personal como dato laboral">
              Nicolás registra su energía por un mes. Días de energía 1-2: <Tag color="#dc2626">$42.000 promedio</Tag>. Días de energía 4-5: <Tag color={C.green}>$98.000 promedio</Tag>. Conclusión: salir a trabajar mal descansado no solo es agotador, es económicamente ineficiente.
            </Scenario>
          </Section>
        </div>
      )}

      {sub==='faq'&&(
        <div>
          <Section title="Preguntas frecuentes">
            {faqs.map((f,i)=>(
              <div key={i} style={{border:`1px solid ${C.border}`,borderRadius:4,marginBottom:6,overflow:'hidden'}}>
                <button onClick={()=>setFaqOpen(faqOpen===i?null:i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'12px 14px',background:'transparent',border:'none',color:C.text,fontSize:13,textAlign:'left',cursor:'pointer',fontFamily:'inherit'}} aria-expanded={faqOpen===i}>
                  <span>{f.q}</span>
                  <span style={{color:C.muted,transform:`rotate(${faqOpen===i?180:0}deg)`,transition:'transform 0.2s',flexShrink:0,fontSize:11}}>▾</span>
                </button>
                {faqOpen===i&&(
                  <div style={{padding:'0 14px 12px',fontSize:13,color:C.muted,lineHeight:1.7,borderTop:`1px solid ${C.border}`}}>
                    <div style={{height:12}} />
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
const VALID = ['resumen','semanas','meses','eficiencia','gastos','proyecciones','guia'];

function DashboardApp() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl  = searchParams.get('seccion');
  const [tab, setTabState] = useState(VALID.includes(tabFromUrl)?tabFromUrl:'resumen');

  const setTab = useCallback((id)=>{
    setTabState(id);
    const p=new URLSearchParams(searchParams.toString()); p.set('seccion',id);
    router.replace(`${pathname}?${p.toString()}`,{scroll:false});
  },[router,pathname,searchParams]);

  useEffect(()=>{
    if(VALID.includes(tabFromUrl)&&tabFromUrl!==tab) setTabState(tabFromUrl);
  },[tabFromUrl]);// eslint-disable-line

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async(silent=false)=>{
    if(!silent)setLoading(true); else setRefreshing(true);
    setError(null);
    try{
      const res=await fetch('/api/data'); const json=await res.json();
      if(json.error)throw new Error(json.error);
      setData(json);
    }catch(e){setError(e.message);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{
    fetchData();
    const iv=setInterval(()=>fetchData(true),60000);
    return ()=>clearInterval(iv);
  },[fetchData]);

  return (
    <div style={{display:'flex',minHeight:'100vh',background:C.bg}}>
      <Sidebar />
      <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
        <a href="#main" className="sr-only focus:not-sr-only" style={{position:'absolute',top:8,left:208,background:C.accent,color:'#fff',padding:'6px 12px',borderRadius:4,fontSize:12,zIndex:50}}>Ir al contenido</a>
        <Header config={data?.config} resumen={data?.resumen} lastUpdated={data?.lastUpdated} refreshing={refreshing} onRefresh={()=>fetchData(true)} />
        <NavTabs active={tab} setActive={setTab} />
        <main id="main" style={{flex:1,padding:'32px',maxWidth:1200,width:'100%'}}>
          {tab==='guia' ? (
            <SectionGuia />
          ) : loading ? (
            <Skeleton />
          ) : error ? (
            <div role="alert" style={{border:`1px solid ${C.accent}`,color:C.accent,padding:'16px',borderRadius:4,marginBottom:24}}>
              <div style={{fontWeight:600,marginBottom:6}}>Error al cargar los datos</div>
              <p style={{fontSize:13,marginBottom:12}}>{error}</p>
              <button onClick={()=>fetchData()} style={{background:C.accent,color:'#fff',border:'none',borderRadius:4,padding:'8px 16px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Reintentar</button>
            </div>
          ) : (
            <>
              {tab==='resumen'      && <SectionResumen       resumen={data?.resumen}         registroDiario={data?.registroDiario} />}
              {tab==='semanas'      && <SectionSemanas       resumenSemanal={data?.resumenSemanal} />}
              {tab==='meses'        && <SectionMeses         resumenMensual={data?.resumenMensual} resumen={data?.resumen} />}
              {tab==='eficiencia'   && <SectionEficiencia    registroDiario={data?.registroDiario} />}
              {tab==='gastos'       && <SectionGastos        registroDiario={data?.registroDiario} gastosPorCategoria={data?.gastosPorCategoria} />}
              {tab==='proyecciones' && <SectionProyecciones  registroDiario={data?.registroDiario} resumen={data?.resumen} />}
            </>
          )}
        </main>
        <footer style={{borderTop:`1px solid ${C.border}`,padding:'16px 32px',fontSize:11,color:C.dim}}>
          GestorPro · PedidosYa · Tucumán · Supabase
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#080808',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'#2a2a2a',fontSize:13}}>Cargando…</div></div>}>
      <DashboardApp />
    </Suspense>
  );
}

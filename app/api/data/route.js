import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-options';
import { supabaseAdmin } from '../../../lib/supabase';

const fmt = (n) => (n == null ? null : Number(n));

function getMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: rows, error: rowsErr } = await supabaseAdmin
    .from('registros_con_calculos')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(500);

  if (rowsErr) return NextResponse.json({ error: rowsErr.message }, { status: 500 });

  const { data: cfg } = await supabaseAdmin
    .from('configuracion')
    .select('*')
    .order('id')
    .limit(1)
    .single();

  const registroDiario = (rows || []).map((r) => ({
    id:            r.id,
    fecha:         r.fecha,
    dia:           r.dia_semana,
    saldoInicial:  fmt(r.saldo_inicial),
    totalGenerado: fmt(r.total_generado),
    efectivo:      fmt(r.efectivo),
    porApp:        fmt(r.por_app),
    totalDia:      fmt(r.total_dia),
    nafta:         fmt(r.nafta),
    comida:        fmt(r.comida),
    otros:         fmt(r.otros_gastos),
    totalGastos:   fmt(r.total_gastos),
    gananciaReal:  fmt(r.ganancia_real),
    horas:         fmt(r.horas),
    pedidos:       fmt(r.pedidos),
    km:            fmt(r.km),
    xHora:         fmt(r.ganancia_por_hora),
    xPedido:       fmt(r.ganancia_por_pedido),
    clima:         r.clima,
    energia:       fmt(r.energia),
    temperatura:   fmt(r.temperatura),
    notas:         r.notas,
  }));

  // ── Agregados globales ─────────────────────────────────────
  const diasTrabajados = registroDiario.filter(r => r.gananciaReal != null).length;
  const gananciaTotal  = registroDiario.reduce((a, r) => a + (r.gananciaReal || 0), 0);
  const pedidosTotal   = registroDiario.reduce((a, r) => a + (r.pedidos || 0), 0);
  const horasTotal     = registroDiario.reduce((a, r) => a + (r.horas || 0), 0);
  const gastosTotal    = registroDiario.reduce((a, r) => a + (r.totalGastos || 0), 0);

  const metaMensual = fmt(cfg?.meta_mensual) || 600000;
  const metaDiaria  = fmt(cfg?.meta_diaria)  || 20000;

  // ── Gastos por categoría ───────────────────────────────────
  const gastosPorCategoria = {
    nafta:  Math.round(registroDiario.reduce((a, r) => a + (r.nafta  || 0), 0)),
    comida: Math.round(registroDiario.reduce((a, r) => a + (r.comida || 0), 0)),
    otros:  Math.round(registroDiario.reduce((a, r) => a + (r.otros  || 0), 0)),
  };

  // ── Resumen semanal ────────────────────────────────────────
  const porSemana = {};
  registroDiario.forEach(r => {
    if (!r.fecha) return;
    const monday = getMonday(r.fecha);
    if (!porSemana[monday]) porSemana[monday] = [];
    porSemana[monday].push(r);
  });

  const resumenSemanal = Object.entries(porSemana)
    .map(([monday, rws]) => {
      const ganancia = rws.reduce((a, r) => a + (r.gananciaReal || 0), 0);
      const gastos   = rws.reduce((a, r) => a + (r.totalGastos  || 0), 0);
      const nafta    = rws.reduce((a, r) => a + (r.nafta  || 0), 0);
      const comida   = rws.reduce((a, r) => a + (r.comida || 0), 0);
      const otros    = rws.reduce((a, r) => a + (r.otros  || 0), 0);
      const pedidos  = rws.reduce((a, r) => a + (r.pedidos || 0), 0);
      const horas    = rws.reduce((a, r) => a + (r.horas   || 0), 0);
      const km       = rws.reduce((a, r) => a + (r.km      || 0), 0);
      const dias     = rws.filter(r => r.gananciaReal != null).length;
      const sun      = new Date(monday + 'T00:00:00');
      sun.setDate(sun.getDate() + 6);
      const sunday   = sun.toISOString().split('T')[0];
      return {
        monday,
        sunday,
        ganancia: Math.round(ganancia),
        gastos:   Math.round(gastos),
        nafta:    Math.round(nafta),
        comida:   Math.round(comida),
        otros:    Math.round(otros),
        pedidos,
        horas:    Math.round(horas * 10) / 10,
        km:       Math.round(km   * 10) / 10,
        dias,
        promDia:  dias   ? Math.round(ganancia / dias)  : 0,
        xHora:    horas  ? Math.round(ganancia / horas) : 0,
      };
    })
    .sort((a, b) => b.monday.localeCompare(a.monday));

  // ── Resumen mensual ────────────────────────────────────────
  const porMes = {};
  registroDiario.forEach(r => {
    if (!r.fecha) return;
    const mes = r.fecha.slice(0, 7);
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(r);
  });

  const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const resumenMensual = Object.entries(porMes)
    .map(([mes, rws]) => {
      const ganancia = rws.reduce((a, r) => a + (r.gananciaReal || 0), 0);
      const gastos   = rws.reduce((a, r) => a + (r.totalGastos  || 0), 0);
      const nafta    = rws.reduce((a, r) => a + (r.nafta  || 0), 0);
      const comida   = rws.reduce((a, r) => a + (r.comida || 0), 0);
      const otros    = rws.reduce((a, r) => a + (r.otros  || 0), 0);
      const pedidos  = rws.reduce((a, r) => a + (r.pedidos || 0), 0);
      const horas    = rws.reduce((a, r) => a + (r.horas   || 0), 0);
      const km       = rws.reduce((a, r) => a + (r.km      || 0), 0);
      const dias     = rws.filter(r => r.gananciaReal != null).length;
      const [y, m]   = mes.split('-');
      return {
        mes,
        label: `${MESES_ES[parseInt(m) - 1]} ${y}`,
        ganancia: Math.round(ganancia),
        gastos:   Math.round(gastos),
        nafta:    Math.round(nafta),
        comida:   Math.round(comida),
        otros:    Math.round(otros),
        pedidos,
        horas:    Math.round(horas * 10) / 10,
        km:       Math.round(km   * 10) / 10,
        dias,
        promDia:  dias  ? Math.round(ganancia / dias)  : 0,
        xHora:    horas ? Math.round(ganancia / horas) : 0,
      };
    })
    .sort((a, b) => b.mes.localeCompare(a.mes));

  // ── Eficiencia por día/clima ───────────────────────────────
  const porDia = {};
  registroDiario.forEach(r => {
    if (!r.dia) return;
    if (!porDia[r.dia]) porDia[r.dia] = { sum: 0, cnt: 0, pedidos: 0 };
    porDia[r.dia].sum     += r.gananciaReal || 0;
    porDia[r.dia].cnt     += 1;
    porDia[r.dia].pedidos += r.pedidos || 0;
  });
  const eficienciaDia = Object.entries(porDia).map(([dia, v]) => ({
    dia,
    promGanancia: Math.round(v.sum / v.cnt),
    promPedidos:  Math.round((v.pedidos / v.cnt) * 10) / 10,
    dias:         v.cnt,
  }));

  return NextResponse.json({
    registroDiario,
    resumenSemanal,
    resumenMensual,
    gastosPorCategoria,
    eficienciaDia,
    resumen: {
      diasTrabajados,
      gananciaTotal:   Math.round(gananciaTotal),
      pedidosTotal,
      horasTotal:      Math.round(horasTotal * 10) / 10,
      gastosTotal:     Math.round(gastosTotal),
      gananciaPromDia: diasTrabajados ? Math.round(gananciaTotal / diasTrabajados) : 0,
      xHoraPromedio:   horasTotal     ? Math.round(gananciaTotal / horasTotal)     : 0,
      xPedidoPromedio: pedidosTotal   ? Math.round(gananciaTotal / pedidosTotal)   : 0,
      metaMensual,
      metaDiaria,
    },
    config:          cfg || {},
    lastUpdated:     new Date().toISOString(),
    // compat
    turnos:          [],
    ranking:         [],
  });
}

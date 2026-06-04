import { NextResponse } from 'next/server';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '14gvqUw_rX9smW8wpoubfX3fDy5PNO31s79IccaxZWxc';
const API_KEY = process.env.GOOGLE_API_KEY;
const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchRange(sheetName, range = 'A1:AJ500') {
  const encoded = encodeURIComponent(`${sheetName}!${range}`);
  const res = await fetch(`${BASE}/values/${encoded}?key=${API_KEY}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.values || null;
}

async function trySheetNames(candidates) {
  for (const name of candidates) {
    const rows = await fetchRange(name);
    if (rows && rows.length > 2) return rows;
  }
  return null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const isDate = (v) => /^\d{2}\/\d{2}\/\d{4}$/.test(String(v ?? ''));
const isNumStr = (v) => v != null && v !== '' && v !== '-' && v !== '—' && !isNaN(Number(String(v).replace(/[$,.% ]/g, '')));

const num = (v) => {
  if (v == null || v === '' || v === '-' || v === '—') return null;
  const n = Number(String(v).replace(/[$,. ]/g, '').replace('%', ''));
  return isNaN(n) ? null : n;
};

function findHeaderRow(rows, keywords) {
  return rows.findIndex(row =>
    keywords.every(kw =>
      row.some(cell => String(cell ?? '').toUpperCase().includes(kw.toUpperCase()))
    )
  );
}

function rowToObj(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i] ?? null; });
  return obj;
}

// ── Parsers ────────────────────────────────────────────────────────────────

function parseRegistroDiario(rows) {
  if (!rows) return [];
  const hi = findHeaderRow(rows, ['FECHA', 'GANANCIA']);
  if (hi === -1) return [];
  const h = rows[hi];
  const idx = (kw) => h.findIndex(c => String(c ?? '').toUpperCase().includes(kw.toUpperCase()));
  const iF = 0, iD = 1, iSI = idx('SALDO'), iTG = idx('GENERADO'),
    iEF = idx('EFECTIVO'), iPA = idx('APLICACI'), iTDia = idx('TOTAL DÍA') !== -1 ? idx('TOTAL DÍA') : idx('TOTAL DIA'),
    iNafta = idx('NAFTA'), iComida = idx('COMIDA'), iOtros = idx('OTROS GASTO'),
    iTG2 = idx('TOTAL GASTOS') !== -1 ? idx('TOTAL GASTOS') : idx('GASTOS'),
    iGR = idx('GANANCIA REAL') !== -1 ? idx('GANANCIA REAL') : idx('GANANCIA'),
    iH = idx('HORAS'), iP = idx('PEDIDOS'), iKM = idx('KM'),
    iXH = idx('$/HORA'), iXP = idx('$/PEDIDO'), iNotas = idx('NOTAS'),
    iClima = idx('CLIMA'), iEnergia = idx('ENERG'), iNotaDia = idx('NOTA DIA') !== -1 ? idx('NOTA DIA') : idx('NOTA DÍA');

  return rows.slice(hi + 1)
    .filter(r => isDate(r[iF]))
    .map(r => ({
      fecha: r[iF],
      dia: r[iD],
      saldoInicial: num(r[iSI]),
      totalGenerado: num(r[iTG]),
      efectivo: num(r[iEF]),
      porApp: num(r[iPA]),
      totalDia: num(r[iTDia]),
      nafta: num(r[iNafta]),
      comida: num(r[iComida]),
      otros: num(r[iOtros]),
      totalGastos: num(r[iTG2]),
      gananciaReal: num(r[iGR]),
      horas: num(r[iH]),
      pedidos: num(r[iP]),
      km: num(r[iKM]),
      xHora: num(r[iXH]),
      xPedido: num(r[iXP]),
      notas: r[iNotas] ?? null,
      clima: r[iClima] ?? null,
      energia: num(r[iEnergia]),
      notaDia: r[iNotaDia] ?? null,
    }));
}

function parseTurnos(rows) {
  if (!rows) return [];
  const hi = findHeaderRow(rows, ['HORA INICIO', 'ZONA']);
  if (hi === -1) return [];
  return rows.slice(hi + 1)
    .filter(r => isDate(r[0]))
    .map(r => ({
      fecha: r[0],
      n: num(r[1]),
      inicio: r[2] ?? null,
      fin: r[3] ?? null,
      duracion: num(r[4]),
      zona: r[5] ?? null,
      especial: String(r[6] ?? '').toUpperCase().includes('SI') || String(r[6] ?? '').includes('⭐'),
      hrsEspecial: num(r[7]),
      presento: String(r[8] ?? '').toUpperCase().includes('SI'),
      pedidos: num(r[9]),
      aceptacion: num(r[10]),
      nota: r[11] ?? null,
    }));
}

function parseRanking(rows) {
  if (!rows) return [];
  const hi = findHeaderRow(rows, ['DESDE', 'GRUPO']);
  if (hi === -1) return [];
  return rows.slice(hi + 1)
    .filter(r => isNumStr(r[0]) && r[1])
    .map(r => ({
      n: num(r[0]),
      desde: r[1] ?? null,
      hasta: r[2] ?? null,
      pedidos: num(r[3]),
      metaPedidos: num(r[4]),
      okPedidos: r[5] ?? null,
      hrsEspecial: num(r[6]),
      metaHrs: num(r[7]),
      okHrs: r[8] ?? null,
      aceptacion: num(r[9]),
      metaAcep: num(r[10]),
      okAcep: r[11] ?? null,
      noPresent: num(r[12]),
      metaNoPresent: num(r[13]),
      okNoPresent: r[14] ?? null,
      hrsRealVsPlan: r[15] ?? null,
      okHrsRealVsPlan: r[16] ?? null,
      grupoEstimado: r[17] ?? null,
      grupoReal: r[18] ?? null,
      dia: r[19] ?? null,
      hora: r[20] ?? null,
    }));
}

function parseMantenimiento(rows) {
  if (!rows) return [];
  const hi = findHeaderRow(rows, ['DESCRIPCI', 'COSTO']);
  if (hi === -1) return [];
  return rows.slice(hi + 1)
    .filter(r => isDate(r[0]))
    .map(r => ({
      fecha: r[0],
      tipo: r[1] ?? null,
      descripcion: r[2] ?? null,
      km: num(r[3]),
      costo: num(r[4]),
      proximoKm: num(r[5]),
      notas: r[6] ?? null,
    }));
}

function parseMundial(rows) {
  if (!rows) return [];
  const hi = findHeaderRow(rows, ['FASE', 'SEDE']);
  if (hi === -1) return [];
  return rows.slice(hi + 1)
    .filter(r => isDate(r[0]))
    .map(r => ({
      fecha: r[0],
      dia: r[1] ?? null,
      hora: r[2] ?? null,
      fase: r[3] ?? null,
      partido: r[4] ?? null,
      sede: r[5] ?? null,
      resultadoOficial: r[6] ?? null,
      resultadoNico: r[7] ?? null,
      ganancia: num(r[8]),
      pedidos: num(r[9]),
      km: num(r[10]),
      horas: num(r[11]),
      trabajo: r[12] ?? null,
      vsPromedio: num(r[13]),
      clima: r[14] ?? null,
      energia: num(r[15]),
      nota: r[16] ?? null,
    }));
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Falta configurar GOOGLE_API_KEY en las variables de entorno de Vercel.' },
      { status: 500 }
    );
  }

  try {
    const [rdRows, tRows, rkRows, mtRows, mwRows] = await Promise.all([
      trySheetNames(['Registro Diario', '📝 Registro Diario']),
      trySheetNames(['Turnos', 'Registro de Turnos', '🗓️ Turnos', '📋 Turnos']),
      trySheetNames(['Ranking Semanal', '🏆 Ranking Semanal', 'Ranking']),
      trySheetNames(['Mantenimiento', '🏍️ Mantenimiento', '🔧 Mantenimiento']),
      trySheetNames(['Mundial 2026', '⚽ Mundial 2026', 'Mundial']),
    ]);

    const registroDiario = parseRegistroDiario(rdRows);
    const turnos = parseTurnos(tRows);
    const ranking = parseRanking(rkRows);
    const mantenimiento = parseMantenimiento(mtRows);
    const mundial = parseMundial(mwRows);

    // Resumen calculado desde los datos reales
    const turnosPresentes = turnos.filter(t => t.presento);
    const totalPedidosTurnos = turnosPresentes.reduce((a, t) => a + (t.pedidos || 0), 0);
    const totalHrsTurnos = turnosPresentes.reduce((a, t) => a + (t.duracion || 0), 0);
    const hrsEspeciales = turnos.filter(t => t.especial && t.presento).reduce((a, t) => a + (t.hrsEspecial || 0), 0);
    const aceps = turnos.filter(t => t.aceptacion != null).map(t => t.aceptacion);
    const acepProm = aceps.length ? aceps.reduce((a, b) => a + b, 0) / aceps.length : null;
    const diasTrabajados = registroDiario.filter(r => r.gananciaReal != null || r.totalGenerado != null).length;
    const gananciaTotal = registroDiario.reduce((a, r) => a + (r.gananciaReal || 0), 0);
    const gastoTotal = registroDiario.reduce((a, r) => a + (r.totalGastos || 0), 0);
    const pedidosTotal = registroDiario.reduce((a, r) => a + (r.pedidos || 0), 0);
    const kmTotal = registroDiario.reduce((a, r) => a + (r.km || 0), 0);
    const horasTotal = registroDiario.reduce((a, r) => a + (r.horas || 0), 0);

    return NextResponse.json({
      lastUpdated: new Date().toISOString(),
      resumen: {
        diasTrabajados,
        gananciaTotal,
        gastoTotal,
        pedidosTotal,
        kmTotal: Math.round(kmTotal * 10) / 10,
        horasTotal: Math.round(horasTotal * 10) / 10,
        totalPedidosTurnos,
        totalHrsTurnos: Math.round(totalHrsTurnos * 10) / 10,
        hrsEspeciales: Math.round(hrsEspeciales * 10) / 10,
        acepProm: acepProm != null ? Math.round(acepProm * 10) / 10 : null,
        presentaciones: turnosPresentes.length,
        totalTurnos: turnos.length,
      },
      registroDiario,
      turnos,
      ranking,
      mantenimiento,
      mundial,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

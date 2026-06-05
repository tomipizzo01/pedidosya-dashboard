import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// ─────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────
const SHEET_ID      = process.env.GOOGLE_SHEET_ID;
const SALDO_FIJO    = 50000;
const DIAS          = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

const SH_FINANZAS   = '📅 Registro Diario';
const SH_TURNOS     = '📅 Turnos';
const SH_CONFIG     = '⚙️ Configuración';

// Fila de inicio de la tabla de sesiones dentro de ⚙️ Configuración
// (se escribe desde la fila 80 para no pisar datos existentes)
const SES_ROW_START = 80;
const SES_EXPIRY_MS = 30 * 60 * 1000; // 30 minutos de inactividad resetean el menú

// ─────────────────────────────────────────────
//  GOOGLE AUTH
// ─────────────────────────────────────────────
async function getSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    const fixed = raw.replace(
      /"private_key"\s*:\s*"([\s\S]*?)"\s*,/,
      (match, pk) => match.replace(pk, pk.replace(/\n/g, '\\n'))
    );
    credentials = JSON.parse(fixed);
  }
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ─────────────────────────────────────────────
//  SESIONES  (estado del usuario en el menú)
// ─────────────────────────────────────────────
async function getSession(sheets, phone) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${SH_CONFIG}'!A${SES_ROW_START}:D200`,
  });
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]?.[0] === phone) {
      const ts = parseInt(rows[i][2] || '0');
      const state = (Date.now() - ts < SES_EXPIRY_MS) ? (rows[i][1] || 'MAIN') : 'MAIN';
      return { state, idx: i };
    }
  }
  return { state: 'MAIN', idx: -1 };
}

async function setSession(sheets, phone, state, idx) {
  let rowNum;
  if (idx === -1) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SH_CONFIG}'!A${SES_ROW_START}:A200`,
    });
    const rows = res.data.values || [];
    const empty = rows.findIndex(r => !r?.[0]);
    rowNum = SES_ROW_START + (empty === -1 ? rows.length : empty);
  } else {
    rowNum = SES_ROW_START + idx;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'${SH_CONFIG}'!A${rowNum}:D${rowNum}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[phone, state, Date.now().toString(), new Date().toISOString()]] },
  });
}

// ─────────────────────────────────────────────
//  HELPERS GENERALES
// ─────────────────────────────────────────────
function nowAR() {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dd   = String(d.getUTCDate()).padStart(2,'0');
  const mm   = String(d.getUTCMonth()+1).padStart(2,'0');
  const yyyy = d.getUTCFullYear();
  return { fecha: `${dd}/${mm}/${yyyy}`, dia: DIAS[d.getUTCDay()], dateObj: d };
}

function tomorrowAR() {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000 + 86400000);
  const dd   = String(d.getUTCDate()).padStart(2,'0');
  const mm   = String(d.getUTCMonth()+1).padStart(2,'0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function norm(t) {
  return t.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/\$/g,'').replace(/\n/g,' ');
}

function exNum(t, patterns) {
  for (const pat of patterns) {
    const m = t.match(pat);
    if (m) {
      const n = parseFloat(m[1].replace(/\./g,'').replace(',','.'));
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

const $ar = (v) => v != null ? '$' + Math.round(v).toLocaleString('es-AR') : null;

function twiml(text) {
  const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

// ─────────────────────────────────────────────
//  MENSAJES DE MENÚ
// ─────────────────────────────────────────────
const MSG_MAIN = `🛵 *Hola Nico! ¿Qué querés registrar?*

1️⃣  Finanzas del día
2️⃣  Turnos de trabajo

Respondé con *1* o *2*.
────────────────
_Escribí *menu* en cualquier momento para volver acá._`;

const MSG_FINANZAS = `💰 *Sección 1 — Finanzas del día*

Mandame los datos de tu jornada en lenguaje natural. Ejemplo:

_"Saldo 40000, generé 85000, efectivo 40000, nafta 3000, comida 1500, 7 horas, 30 pedidos, 90km, soleado, energía 4"_

📌 Podés incluir:
• *Saldo inicial* — lo que te dio Emi al salir (ej: "saldo 40000", "sin saldo", "saldo 0")
• Generado · Efectivo · Nafta · Comida · Otros
• Horas · Pedidos · KM
• Clima: soleado/nublado/lluvia/tormenta/calor
• Energía: del 1 al 5

💡 Si no indicás el saldo, se usa $50.000 por defecto.

_Escribí *menu* para volver al inicio._`;

const MSG_TURNOS = `📋 *Sección 2 — Turnos de trabajo*

¿Qué querés hacer?

*A* · Registrar un turno nuevo
*B* · Cargar resultado de un turno

Respondé con *A* o *B*.
────────────────
_Escribí *menu* para volver al inicio._`;

const MSG_TURNO_NUEVO = `📋 *Turno nuevo*

Mandame los datos del turno. Ejemplo:

_"Turno mañana 20:00 a 00:30, zona Centro, especial"_
_"Turno hoy 9:30 a 12:30, zona Norte"_
_"Turno 07/06/2026 15:00 a 19:00, zona Sur"_

📌 Podés incluir:
• Fecha: *hoy*, *mañana* o DD/MM/AAAA
• Hora inicio y fin (formato HH:MM)
• Zona: Centro / Norte / Sur / Yerba Buena / etc.
• Escribí *especial* si es turno ⭐

_Escribí *menu* para volver al inicio._`;

const MSG_TURNO_RESULTADO = `✅ *Resultado de turno*

Mandame el resultado. Ejemplo:

_"Hoy turno 1, 22 pedidos, aceptación 98%"_
_"Ayer turno 2, 18 pedidos, 100%"_

📌 Podés incluir:
• Fecha: *hoy*, *ayer* o DD/MM/AAAA
• Número de turno (si tuviste más de uno)
• Pedidos entregados
• % de aceptación
• Si *no te presentaste* escribilo

_Escribí *menu* para volver al inicio._`;

// ─────────────────────────────────────────────
//  SECCIÓN 1 — FINANZAS
// ─────────────────────────────────────────────
function parseFinanzas(body) {
  const t = norm(body);

  // Saldo inicial — detecta frases como:
  // "saldo 40000", "saldo inicial 40000", "emi me dio 50000",
  // "sali con 30000", "sin saldo", "saldo 0"
  let saldoInicial = null;
  if (t.includes('sin saldo') || t.match(/saldo\s*(inicial\s*)?0\b/)) {
    saldoInicial = 0;
  } else {
    const rawSaldo = exNum(t, [
      /saldo\s*(?:inicial\s*)?([0-9.,]+)/,
      /emi\s*(?:me\s*(?:dio|mando|paso)\s*)([0-9.,]+)/,
      /sali\s*(?:con\s*)([0-9.,]+)/,
      /sal[i]\s*(?:de\s*casa\s*)?(?:con\s*)([0-9.,]+)/,
    ]);
    if (rawSaldo != null) {
      // Validar umbral: mínimo $0, máximo $100.000
      saldoInicial = Math.min(Math.max(Math.round(rawSaldo), 0), 100000);
    }
  }

  return {
    saldoInicial,
    totalGenerado: exNum(t,[
      /(?:genere?|gane?|total(?:\s*gen(?:erado)?)?|facture?)\s*([0-9.,]+)/,
      /([0-9.,]+)\s*(?:generado|de total|en total)/,
    ]),
    efectivo: exNum(t,[
      /efectivo\s*([0-9.,]+)/,
      /([0-9.,]+)\s*(?:en\s*)?efectivo/,
      /cobr[e]\s*([0-9.,]+)/,
    ]),
    nafta:   exNum(t,[/nafta\s*([0-9.,]+)/,/([0-9.,]+)\s*(?:de\s*|en\s*)?nafta/]),
    comida:  exNum(t,[/comida\s*([0-9.,]+)/,/([0-9.,]+)\s*(?:de\s*|en\s*)?comida/]),
    otros:   exNum(t,[/otros?\s*([0-9.,]+)/,/([0-9.,]+)\s*(?:de\s*|en\s*)?otros?/]),
    horas:   exNum(t,[/([0-9.,]+)\s*h(?:oras?)?\b/,/trabaj[e]\s*([0-9.,]+)/]),
    pedidos: exNum(t,[/([0-9]+)\s*pedidos?\b/,/hice?\s*([0-9]+)/,/entregu[e]\s*([0-9]+)/]),
    km:      exNum(t,[/([0-9.,]+)\s*km\b/,/recorr[i]\s*([0-9.,]+)/]),
    energia: (() => { const m = t.match(/energia\s*:?\s*([1-5])/); return m ? +m[1] : null; })(),
    clima:   (() => {
      if (t.includes('tormenta')) return 'Tormenta';
      if (t.includes('lluvi'))    return 'Lluvia';
      if (t.includes('nublado'))  return 'Nublado';
      if (t.includes('soleado') || (t.includes('sol') && !t.includes('solo'))) return 'Soleado';
      if (t.includes('calor'))    return 'Calor extremo';
      return null;
    })(),
  };
}

async function findOrCreateFinanzasRow(sheets, fecha) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${SH_FINANZAS}'!A1:A300`,
  });
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]?.[0] === fecha) return i + 1;
  }
  for (let i = 5; i < rows.length; i++) {
    if (!rows[i]?.[0]) return i + 1;
  }
  return rows.length + 1;
}

async function saveFinanzas(sheets, data) {
  const { fecha, dia } = nowAR();
  const rowNum = await findOrCreateFinanzasRow(sheets, fecha);
  const { saldoInicial: saldoMsg, totalGenerado, efectivo, nafta, comida, otros, horas, pedidos, km, clima, energia } = data;

  // Usar el saldo que mandó Nico; si no mandó ninguno, usar el valor fijo de $50.000
  const saldoUsado  = saldoMsg != null ? saldoMsg : SALDO_FIJO;
  const porApp      = totalGenerado != null && efectivo != null ? totalGenerado - efectivo : null;
  const totalGastos = (nafta||0) + (comida||0) + (otros||0);
  const ganReal     = totalGenerado != null ? saldoUsado + totalGenerado - totalGastos : null;
  const xHora       = ganReal != null && horas   ? ganReal / horas   : null;
  const xPedido     = ganReal != null && pedidos ? ganReal / pedidos : null;

  const v = x => x != null ? x : '';
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'${SH_FINANZAS}'!A${rowNum}`, values: [[fecha]] },
        { range: `'${SH_FINANZAS}'!B${rowNum}`, values: [[dia]] },
        { range: `'${SH_FINANZAS}'!C${rowNum}`, values: [[saldoUsado]] },
        { range: `'${SH_FINANZAS}'!D${rowNum}`, values: [[v(totalGenerado)]] },
        { range: `'${SH_FINANZAS}'!E${rowNum}`, values: [[v(efectivo)]] },
        { range: `'${SH_FINANZAS}'!H${rowNum}`, values: [[v(nafta)]] },
        { range: `'${SH_FINANZAS}'!I${rowNum}`, values: [[v(comida)]] },
        { range: `'${SH_FINANZAS}'!J${rowNum}`, values: [[v(otros)]] },
        { range: `'${SH_FINANZAS}'!M${rowNum}`, values: [[v(horas)]] },
        { range: `'${SH_FINANZAS}'!N${rowNum}`, values: [[v(pedidos)]] },
        { range: `'${SH_FINANZAS}'!O${rowNum}`, values: [[v(km)]] },
        { range: `'${SH_FINANZAS}'!Y${rowNum}`, values: [[v(clima)]] },
        { range: `'${SH_FINANZAS}'!Z${rowNum}`, values: [[v(energia)]] },
      ],
    },
  });
  return { ganReal, totalGastos, porApp, xHora, xPedido, saldoUsado };
}

function buildFinanzasReply(data, result, fecha) {
  const { totalGenerado, efectivo, nafta, comida, otros, horas, pedidos, km, clima, energia, saldoInicial } = data;
  const { ganReal, totalGastos, porApp, xHora, xPedido, saldoUsado } = result;

  // Aviso si se usó el saldo por defecto porque Nico no lo incluyó
  const saldoAviso = saldoInicial == null
    ? `\n⚠️ _No indicaste saldo inicial — se usó el valor por defecto de ${$ar(SALDO_FIJO)}._\n_Si fue distinto, incluilo la próxima vez: "saldo 40000, generé..."_`
    : null;

  return [
    `✅ *Guardado — ${fecha}*`, '',
    `💵 Saldo inicial (Emi): *${$ar(saldoUsado)}*`,
    totalGenerado != null ? `💰 Total generado: *${$ar(totalGenerado)}*` : null,
    efectivo  != null     ? `💵 Efectivo: ${$ar(efectivo)}`              : null,
    porApp    != null     ? `📱 Por app: ${$ar(porApp)}`                 : null,
    (nafta||comida||otros) ? '' : null,
    nafta   ? `⛽ Nafta: ${$ar(nafta)}`   : null,
    comida  ? `🍔 Comida: ${$ar(comida)}` : null,
    otros   ? `📦 Otros: ${$ar(otros)}`   : null,
    totalGastos > 0 ? `💸 Total gastos: ${$ar(totalGastos)}` : null,
    '',
    ganReal != null ? `🏆 *GANANCIA REAL: ${$ar(ganReal)}*` : null,
    '',
    [horas ? `⏱️ ${horas}hs` : null, pedidos ? `📦 ${pedidos} pedidos` : null, km ? `🛣️ ${km}km` : null].filter(Boolean).join(' · ') || null,
    [xHora ? `${$ar(xHora)}/hora` : null, xPedido ? `${$ar(xPedido)}/pedido` : null].filter(Boolean).join(' · ') || null,
    clima   ? `🌤️ ${clima}`       : null,
    energia ? `⚡ Energía: ${energia}/5` : null,
    saldoAviso,
    '',
    '_Escribí *menu* para volver al inicio o mandá más datos._',
  ].filter(x => x !== null).join('\n');
}

// ─────────────────────────────────────────────
//  SECCIÓN 2 — TURNOS
// ─────────────────────────────────────────────
function parseFecha(t) {
  if (t.includes('manana') || t.includes('mañana')) return tomorrowAR();
  if (t.includes('ayer')) {
    const d = new Date(Date.now() - 3*60*60*1000 - 86400000);
    return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
  }
  const m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return m[0];
  return nowAR().fecha; // default: hoy
}

function parseTurnoNuevo(body) {
  const t = norm(body);
  const horaM = [...t.matchAll(/(\d{1,2}:\d{2})/g)].map(m => m[1]);
  return {
    fecha:    parseFecha(t),
    inicio:   horaM[0] || null,
    fin:      horaM[1] || null,
    zona:     (() => {
      const m = t.match(/zona\s+([a-záéíóúñ\s]+?)(?:\s*,|\s*$|\s*especial)/i);
      if (m) return m[1].trim().replace(/\b\w/g, c => c.toUpperCase());
      const zonas = ['centro','norte','sur','yerba buena','oeste'];
      for (const z of zonas) if (t.includes(z)) return z.replace(/\b\w/g, c => c.toUpperCase());
      return null;
    })(),
    especial: t.includes('especial') || t.includes('⭐'),
  };
}

function parseTurnoResultado(body) {
  const t = norm(body);
  return {
    fecha:      parseFecha(t),
    nTurno:     exNum(t,[/turno\s*([12])/,/([12])\s*(?:er|do)?\s*turno/]) || 1,
    pedidos:    exNum(t,[/([0-9]+)\s*pedidos?\b/,/hice?\s*([0-9]+)/,/entregu[e]\s*([0-9]+)/]),
    aceptacion: exNum(t,[/([0-9]+(?:[.,][0-9]+)?)\s*%/,/aceptacion\s*([0-9]+)/]),
    presento:   !t.includes('no me presente') && !t.includes('no fui') && !t.includes('no me present'),
  };
}

async function findTurnosNextRow(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${SH_TURNOS}'!A1:A300`,
  });
  const rows = res.data.values || [];
  for (let i = 2; i < rows.length; i++) {
    if (!rows[i]?.[0]) return i + 1;
  }
  return rows.length + 1;
}

async function findTurnoRow(sheets, fecha, nTurno) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${SH_TURNOS}'!A1:B300`,
  });
  const rows = res.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]?.[0] === fecha && String(rows[i]?.[1]) === String(nTurno)) return i + 1;
  }
  return null;
}

async function saveTurnoNuevo(sheets, data) {
  const { fecha, inicio, fin, zona, especial } = data;
  const rowNum = await findTurnosNextRow(sheets);

  // Calcular duración en horas
  let duracion = '';
  if (inicio && fin) {
    const [hI, mI] = inicio.split(':').map(Number);
    let [hF, mF] = fin.split(':').map(Number);
    if (hF < hI) hF += 24; // turno que pasa la medianoche
    duracion = ((hF * 60 + mF - (hI * 60 + mI)) / 60).toFixed(1);
  }

  const v = x => x != null ? x : '';
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'${SH_TURNOS}'!A${rowNum}`, values: [[fecha]] },
        { range: `'${SH_TURNOS}'!B${rowNum}`, values: [[1]] },         // N° turno default
        { range: `'${SH_TURNOS}'!C${rowNum}`, values: [[v(inicio)]] },
        { range: `'${SH_TURNOS}'!D${rowNum}`, values: [[v(fin)]] },
        { range: `'${SH_TURNOS}'!E${rowNum}`, values: [[v(duracion)]] },
        { range: `'${SH_TURNOS}'!F${rowNum}`, values: [[v(zona)]] },
        { range: `'${SH_TURNOS}'!G${rowNum}`, values: [[especial ? 'Si ⭐' : 'No']] },
        { range: `'${SH_TURNOS}'!H${rowNum}`, values: [[especial ? v(duracion) : 0]] },
        { range: `'${SH_TURNOS}'!I${rowNum}`, values: [['—']] }, // pendiente de confirmar
      ],
    },
  });
  return { rowNum, duracion };
}

async function saveTurnoResultado(sheets, data) {
  const { fecha, nTurno, pedidos, aceptacion, presento } = data;
  const rowNum = await findTurnoRow(sheets, fecha, nTurno);
  if (!rowNum) return null;

  const v = x => x != null ? x : '';
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'${SH_TURNOS}'!I${rowNum}`, values: [[presento ? 'Si' : 'No']] },
        { range: `'${SH_TURNOS}'!J${rowNum}`, values: [[v(pedidos)]] },
        { range: `'${SH_TURNOS}'!K${rowNum}`, values: [[v(aceptacion)]] },
      ],
    },
  });
  return rowNum;
}

function buildTurnoNuevoReply(data, duracion) {
  const { fecha, inicio, fin, zona, especial } = data;
  return [
    `📋 *Turno registrado ✅*`, '',
    `📅 Fecha: ${fecha}`,
    inicio ? `🕐 Horario: ${inicio} → ${fin}` : null,
    duracion ? `⏱️ Duración: ${duracion} hs` : null,
    zona ? `📍 Zona: ${zona}` : null,
    especial ? `⭐ Turno especial` : null,
    '',
    `_El resultado (pedidos y aceptación) lo podés cargar después con la opción *2 → B*._`,
    `_Escribí *menu* para volver al inicio._`,
  ].filter(Boolean).join('\n');
}

function buildTurnoResultadoReply(data) {
  const { fecha, nTurno, pedidos, aceptacion, presento } = data;
  const acepColor = aceptacion != null
    ? (aceptacion === 100 ? '✅' : aceptacion >= 95 ? '⚠️' : '❌')
    : '';
  return [
    `✅ *Resultado guardado*`, '',
    `📅 Fecha: ${fecha} — Turno ${nTurno}`,
    `🙋 Asistencia: ${presento ? 'Presente ✅' : 'No se presentó ❌'}`,
    pedidos    != null ? `📦 Pedidos: ${pedidos}` : null,
    aceptacion != null ? `${acepColor} Aceptación: ${aceptacion}%` : null,
    aceptacion != null && aceptacion < 100
      ? `\n⚠️ _Recordá que la meta de aceptación es 100%_`
      : null,
    '',
    `_Escribí *menu* para volver al inicio._`,
  ].filter(Boolean).join('\n');
}

// ─────────────────────────────────────────────
//  HANDLER PRINCIPAL
// ─────────────────────────────────────────────
export async function POST(req) {
  const body   = await req.text();
  const params = new URLSearchParams(body);
  const msg    = (params.get('Body') || '').trim();
  const from   = (params.get('From') || '').trim();

  if (!msg) return twiml('');

  const lower = msg.toLowerCase().trim();

  // Comandos globales (funcionan desde cualquier estado)
  if (['menu','inicio','hola','volver','0'].includes(lower)) {
    const sheets = await getSheetsClient();
    const { idx } = await getSession(sheets, from);
    await setSession(sheets, from, 'MAIN', idx);
    return twiml(MSG_MAIN);
  }

  // Primero leemos el estado del usuario
  const sheets = await getSheetsClient();
  const { state, idx } = await getSession(sheets, from);

  // ── ESTADO: MAIN ──────────────────────────────
  if (state === 'MAIN') {
    if (lower === '1') {
      await setSession(sheets, from, 'FINANZAS', idx);
      return twiml(MSG_FINANZAS);
    }
    if (lower === '2') {
      await setSession(sheets, from, 'TURNOS', idx);
      return twiml(MSG_TURNOS);
    }
    // Si manda datos directamente sin pasar por el menú → intentamos detectar
    const finData = parseFinanzas(msg);
    if (finData.totalGenerado != null) {
      // Lo procesamos como finanzas directamente
      const result = await saveFinanzas(sheets, finData);
      await setSession(sheets, from, 'FINANZAS', idx);
      return twiml(buildFinanzasReply(finData, result, nowAR().fecha));
    }
    return twiml(MSG_MAIN);
  }

  // ── ESTADO: FINANZAS ──────────────────────────
  if (state === 'FINANZAS') {
    const data = parseFinanzas(msg);
    const hasData = Object.values(data).some(v => v != null);
    if (!hasData) {
      return twiml(`No pude entender los datos 😅\n\n${MSG_FINANZAS}`);
    }
    const result = await saveFinanzas(sheets, data);
    // Mantenemos el estado en FINANZAS para que pueda seguir cargando
    return twiml(buildFinanzasReply(data, result, nowAR().fecha));
  }

  // ── ESTADO: TURNOS (submenú A/B) ─────────────
  if (state === 'TURNOS') {
    if (lower === 'a') {
      await setSession(sheets, from, 'TURNO_NUEVO', idx);
      return twiml(MSG_TURNO_NUEVO);
    }
    if (lower === 'b') {
      await setSession(sheets, from, 'TURNO_RESULTADO', idx);
      return twiml(MSG_TURNO_RESULTADO);
    }
    return twiml(`Respondé con *A* para turno nuevo o *B* para cargar resultado.\n\n${MSG_TURNOS}`);
  }

  // ── ESTADO: TURNO_NUEVO ───────────────────────
  if (state === 'TURNO_NUEVO') {
    const data = parseTurnoNuevo(msg);
    if (!data.inicio && !data.zona) {
      return twiml(`No pude entender los datos del turno 😅\n\n${MSG_TURNO_NUEVO}`);
    }
    const { duracion } = await saveTurnoNuevo(sheets, data);
    await setSession(sheets, from, 'MAIN', idx);
    return twiml(buildTurnoNuevoReply(data, duracion));
  }

  // ── ESTADO: TURNO_RESULTADO ───────────────────
  if (state === 'TURNO_RESULTADO') {
    const data = parseTurnoResultado(msg);
    if (!data.pedidos && !data.aceptacion) {
      return twiml(`No pude entender el resultado 😅\n\n${MSG_TURNO_RESULTADO}`);
    }
    const rowNum = await saveTurnoResultado(sheets, data);
    await setSession(sheets, from, 'MAIN', idx);
    if (!rowNum) {
      return twiml(`⚠️ No encontré el turno del ${data.fecha} para actualizar.\n¿Registraste primero el turno nuevo con la opción *A*?`);
    }
    return twiml(buildTurnoResultadoReply(data));
  }

  // Fallback
  await setSession(sheets, from, 'MAIN', idx);
  return twiml(MSG_MAIN);
}

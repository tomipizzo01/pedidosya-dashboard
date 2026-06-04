import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID   = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = '📅 Registro Diario';
const SALDO_FIJO = 50000;
const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// ── Google Sheets auth (Service Account) ──────────────────────────────────

async function getSheetsClient() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ── Fecha Argentina ────────────────────────────────────────────────────────

function nowAR() {
  // UTC-3
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dd  = String(d.getUTCDate()).padStart(2,'0');
  const mm  = String(d.getUTCMonth()+1).padStart(2,'0');
  const yyyy = d.getUTCFullYear();
  return { fecha: `${dd}/${mm}/${yyyy}`, dia: DIAS[d.getUTCDay()] };
}

// ── Parser de lenguaje natural ────────────────────────────────────────────

function norm(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/\$/g,'')
    .replace(/\n/g,' ');
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

function parse(body) {
  const t = norm(body);
  return {
    totalGenerado: exNum(t,[
      /(?:genere?|gane?|total(?:\s*gen(?:erado)?)?|facture?)\s*([0-9.,]+)/,
      /([0-9.,]+)\s*(?:generado|de total|en total|facturado)/,
    ]),
    efectivo: exNum(t,[
      /efectivo\s*([0-9.,]+)/,
      /([0-9.,]+)\s*(?:en\s*)?efectivo/,
      /cobr[e]\s*([0-9.,]+)/,
    ]),
    nafta: exNum(t,[
      /nafta\s*([0-9.,]+)/,
      /([0-9.,]+)\s*(?:de\s*|en\s*)?nafta/,
      /combustible\s*([0-9.,]+)/,
    ]),
    comida: exNum(t,[
      /comida\s*([0-9.,]+)/,
      /([0-9.,]+)\s*(?:de\s*|en\s*)?comida/,
      /almuerzo\s*([0-9.,]+)/,
    ]),
    otros: exNum(t,[
      /otros?\s*([0-9.,]+)/,
      /([0-9.,]+)\s*(?:de\s*|en\s*)?otros?/,
    ]),
    horas: exNum(t,[
      /([0-9.,]+)\s*h(?:oras?)?\b/,
      /trabaj[e]\s*([0-9.,]+)/,
    ]),
    pedidos: exNum(t,[
      /([0-9]+)\s*pedidos?\b/,
      /hice?\s*([0-9]+)/,
      /entregu[e]\s*([0-9]+)/,
    ]),
    km: exNum(t,[
      /([0-9.,]+)\s*km\b/,
      /kilometros?\s*([0-9.,]+)/,
      /recorr[i]\s*([0-9.,]+)/,
    ]),
    energia: (() => {
      const m = t.match(/energia\s*:?\s*([1-5])/);
      return m ? parseInt(m[1]) : null;
    })(),
    clima: (() => {
      if (t.includes('tormenta'))                              return 'Tormenta';
      if (t.includes('lluvi'))                                 return 'Lluvia';
      if (t.includes('nublado'))                               return 'Nublado';
      if (t.includes('soleado')||(t.includes('sol')&&!t.includes('solo'))) return 'Soleado';
      if (t.includes('calor'))                                 return 'Calor extremo';
      return null;
    })(),
  };
}

// ── Buscar o crear fila ────────────────────────────────────────────────────

async function findRow(sheets, fecha) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${SHEET_NAME}'!A1:A300`,
  });
  const rows = res.data.values || [];
  // Buscar fila con la fecha de hoy
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === fecha) return i + 1;
  }
  // Buscar primera fila vacía después de los headers (fila 6+)
  for (let i = 5; i < rows.length; i++) {
    if (!rows[i] || !rows[i][0]) return i + 1;
  }
  return rows.length + 1;
}

// ── Escribir en la planilla ────────────────────────────────────────────────

async function writeToSheet(data) {
  const sheets = await getSheetsClient();
  const { fecha, dia } = nowAR();
  const rowNum = await findRow(sheets, fecha);

  const { totalGenerado, efectivo, nafta, comida, otros, horas, pedidos, km, clima, energia } = data;

  const porApp       = totalGenerado != null && efectivo != null ? totalGenerado - efectivo : null;
  const totalGastos  = (nafta||0) + (comida||0) + (otros||0);
  const gananciaReal = totalGenerado != null ? SALDO_FIJO + totalGenerado - totalGastos : null;
  const xHora        = gananciaReal != null && horas   ? gananciaReal / horas   : null;
  const xPedido      = gananciaReal != null && pedidos ? gananciaReal / pedidos : null;

  const v = (x) => x != null ? x : '';

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'${SHEET_NAME}'!A${rowNum}`, values: [[fecha]] },
        { range: `'${SHEET_NAME}'!B${rowNum}`, values: [[dia]] },
        { range: `'${SHEET_NAME}'!C${rowNum}`, values: [[SALDO_FIJO]] },
        { range: `'${SHEET_NAME}'!D${rowNum}`, values: [[v(totalGenerado)]] },
        { range: `'${SHEET_NAME}'!E${rowNum}`, values: [[v(efectivo)]] },
        { range: `'${SHEET_NAME}'!H${rowNum}`, values: [[v(nafta)]] },
        { range: `'${SHEET_NAME}'!I${rowNum}`, values: [[v(comida)]] },
        { range: `'${SHEET_NAME}'!J${rowNum}`, values: [[v(otros)]] },
        { range: `'${SHEET_NAME}'!M${rowNum}`, values: [[v(horas)]] },
        { range: `'${SHEET_NAME}'!N${rowNum}`, values: [[v(pedidos)]] },
        { range: `'${SHEET_NAME}'!O${rowNum}`, values: [[v(km)]] },
        { range: `'${SHEET_NAME}'!Y${rowNum}`, values: [[v(clima)]] },
        { range: `'${SHEET_NAME}'!Z${rowNum}`, values: [[v(energia)]] },
      ],
    },
  });

  return { gananciaReal, totalGastos, porApp, xHora, xPedido };
}

// ── Helpers de formato ────────────────────────────────────────────────────

const $ = (v) => v != null ? '$' + Math.round(v).toLocaleString('es-AR') : null;

function buildReply(data, result, fecha) {
  const { totalGenerado, efectivo, nafta, comida, otros, horas, pedidos, km, clima, energia } = data;
  const { gananciaReal, totalGastos, porApp, xHora, xPedido } = result;

  const lines = [
    `✅ *Guardado — ${fecha}*`, '',
    totalGenerado != null ? `💰 Total generado: *${$(totalGenerado)}*` : null,
    efectivo  != null ? `💵 Efectivo: ${$(efectivo)}` : null,
    porApp    != null ? `📱 Por app: ${$(porApp)}` : null,
    (nafta||comida||otros) ? '' : null,
    nafta  ? `⛽ Nafta: ${$(nafta)}`   : null,
    comida ? `🍔 Comida: ${$(comida)}` : null,
    otros  ? `📦 Otros: ${$(otros)}`   : null,
    totalGastos > 0 ? `💸 Total gastos: ${$(totalGastos)}` : null,
    '',
    gananciaReal != null ? `🏆 *GANANCIA REAL: ${$(gananciaReal)}*` : null,
    '',
    [horas ? `⏱️ ${horas}hs` : null, pedidos ? `📦 ${pedidos} pedidos` : null, km ? `🛣️ ${km}km` : null].filter(Boolean).join(' · ') || null,
    [xHora ? `${$(xHora)}/hora` : null, xPedido ? `${$(xPedido)}/pedido` : null].filter(Boolean).join(' · ') || null,
    clima   ? `🌤️ ${clima}`      : null,
    energia ? `⚡ Energía: ${energia}/5` : null,
  ].filter(x => x !== null).join('\n');

  return lines;
}

function helpMsg() {
  return `🤖 *Bot Cadete — PedidosYa*

Mandame los datos de tu jornada así:

_"Generé 85000, efectivo 40000, nafta 3000, comida 1500, 7 horas, 30 pedidos, 90km, soleado, energía 4"_

📌 Podés incluir:
• *Generado* — total del día en la app
• *Efectivo* — lo que cobraste en mano
• *Nafta / Comida / Otros* — gastos
• *Horas* — tiempo trabajado
• *Pedidos* — entregas del día
• *KM* — kilómetros recorridos
• *Clima*: soleado · nublado · lluvia · tormenta · calor
• *Energía*: del 1 al 5

El dashboard se actualiza automáticamente 📊`;
}

// ── Handler principal ─────────────────────────────────────────────────────

function twiml(text) {
  const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

export async function POST(req) {
  const body   = await req.text();
  const params = new URLSearchParams(body);
  const msg    = (params.get('Body') || '').trim();
  const lower  = msg.toLowerCase();

  if (!msg) return twiml('No recibí ningún mensaje.');

  if (lower === 'ayuda' || lower === 'help' || lower === '?') {
    return twiml(helpMsg());
  }

  const data    = parse(msg);
  const hasData = Object.values(data).some(v => v != null);

  if (!hasData) {
    return twiml('No pude entender los datos 😅\n\nMandá *ayuda* para ver el formato.');
  }

  try {
    const { fecha } = nowAR();
    const result  = await writeToSheet(data);
    const reply   = buildReply(data, result, fecha);
    return twiml(reply);
  } catch (err) {
    console.error('[whatsapp bot]', err);
    return twiml(`❌ Error al guardar: ${err.message}`);
  }
}

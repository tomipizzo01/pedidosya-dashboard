import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

async function getSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let credentials;
  try { credentials = JSON.parse(raw); }
  catch {
    const fixed = raw.replace(/"private_key"\s*:\s*"([\s\S]*?)"\s*,/,(match, pk) => match.replace(pk, pk.replace(/\n/g, '\\n')));
    credentials = JSON.parse(fixed);
  }
  if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return google.sheets({ version: 'v4', auth });
}

export async function GET() {
  try {
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const sheets = await getSheetsClient();
    const HOJA = '📅 Registro Diario';

    const [baseHeaders, metricasHeaders, filas4y5] = await Promise.all([
      // A3:R3 — encabezados base existentes
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `'${HOJA}'!A3:R3`, valueRenderOption: 'FORMATTED_VALUE' }),
      // S3:AB3 — donde van los nuevos encabezados de métricas avanzadas
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `'${HOJA}'!S3:AB3`, valueRenderOption: 'FORMATTED_VALUE' }),
      // Filas 4 y 5 para ver si hay fórmulas o datos de ejemplo
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `'${HOJA}'!A4:AB5`, valueRenderOption: 'FORMULA' }),
    ]);

    const cols = (row) => row?.map((v, i) => ({ col: i, valor: v })).filter(c => c.valor) || [];

    return NextResponse.json({
      A3_R3: (baseHeaders.data.values?.[0] || []).map((v, i) => {
        const letra = i < 26 ? String.fromCharCode(65+i) : `A${String.fromCharCode(65+i-26)}`;
        return { celda: `${letra}3`, texto: v };
      }),
      S3_AB3_actual: (metricasHeaders.data.values?.[0] || []).map((v, i) => {
        const idx = 18 + i;
        const letra = idx < 26 ? String.fromCharCode(65+idx) : `A${String.fromCharCode(65+idx-26)}`;
        return { celda: `${letra}3`, texto: v };
      }),
      filasEjemplo: filas4y5.data.values || [],
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

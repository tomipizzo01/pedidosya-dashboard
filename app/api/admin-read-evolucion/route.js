import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

async function getSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let credentials;
  try { credentials = JSON.parse(raw); }
  catch {
    const fixed = raw.replace(
      /"private_key"\s*:\s*"([\s\S]*?)"\s*,/,
      (match, pk) => match.replace(pk, pk.replace(/\n/g, '\\n'))
    );
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
    const HOJA = '🏆 Ranking Semanal';

    // Leer contexto amplio: columnas S a Z, filas 20 a 35
    const [valores, formulas] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${HOJA}'!S20:Z35`,
        valueRenderOption: 'FORMATTED_VALUE',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${HOJA}'!S20:Z35`,
        valueRenderOption: 'FORMULA',
      }),
    ]);

    const vals = valores.data.values || [];
    const fmls = formulas.data.values || [];

    const resultado = [];
    for (let r = 0; r < Math.max(vals.length, fmls.length); r++) {
      const filaReal = 20 + r;
      const fila = { fila: filaReal, celdas: {} };
      const cols = ['S','T','U','V','W','X','Y','Z'];
      for (let c = 0; c < 8; c++) {
        const formula = fmls[r]?.[c] ?? '';
        const valor   = vals[r]?.[c] ?? '';
        if (formula || valor) {
          fila.celdas[`${cols[c]}${filaReal}`] = {
            formula: formula.startsWith('=') ? formula : null,
            valor,
          };
        }
      }
      if (Object.keys(fila.celdas).length > 0) resultado.push(fila);
    }

    return NextResponse.json({ ok: true, hoja: HOJA, filas: resultado });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

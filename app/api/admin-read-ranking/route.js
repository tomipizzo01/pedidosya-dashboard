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
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const sheets = await getSheetsClient();

  // Primero listar todas las hojas para encontrar el nombre exacto
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const todasHojas = meta.data.sheets.map(s => s.properties.title);

  const candidatos = ['🏆 Ranking Semanal', 'Ranking Semanal', 'Ranking'];
  const nombreHoja = candidatos.find(c => todasHojas.includes(c));

  if (!nombreHoja) {
    return NextResponse.json({ error: 'Hoja Ranking no encontrada', hojasDisponibles: todasHojas });
  }

  const [valores, formulas] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${nombreHoja}'!A1:Z60`,
      valueRenderOption: 'FORMATTED_VALUE',
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${nombreHoja}'!A1:Z60`,
      valueRenderOption: 'FORMULA',
    }),
  ]);

  const vals = valores.data.values || [];
  const fmls = formulas.data.values || [];

  const resultado = fmls.map((row, r) =>
    row.map((cell, c) => {
      const val = vals[r]?.[c] ?? '';
      if (cell && cell.startsWith('=')) return { formula: cell, valor: val };
      return { valor: cell || val };
    })
  );

  return NextResponse.json({ nombreHoja, filas: resultado, totalFilas: fmls.length, totalCols: Math.max(0, ...fmls.map(r => r.length)) });
}

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

    // W24→B6/C6, W25→B7/C7, ..., W31→B13/C13
    const data = [];
    for (let i = 0; i <= 7; i++) {
      const filaW   = 24 + i;
      const filaBnC = 6 + i;
      const formula = `=IF(B${filaBnC}<>"",TEXT(B${filaBnC},"dd/mm")&"-"&TEXT(C${filaBnC},"dd/mm"),"")`;
      data.push({ range: `'${HOJA}'!W${filaW}`, values: [[formula]] });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data },
    });

    return NextResponse.json({
      ok: true,
      msg: '✅ W24:W31 corregidas — referencias de fila ajustadas',
      celdas: data.map(d => ({ celda: d.range.split('!')[1], formula: d.values[0][0] })),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

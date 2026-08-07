import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

async function getSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let credentials;
  try { credentials = JSON.parse(raw); } catch {
    const fixed = raw.replace(/"private_key"\s*:\s*"([\s\S]*?)"\s*,/, (m, pk) => m.replace(pk, pk.replace(/\n/g, '\\n')));
    credentials = JSON.parse(fixed);
  }
  if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return google.sheets({ version: 'v4', auth });
}

export async function GET() {
  try {
    const sheets = await getSheetsClient();
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    const text = '🚀  CÓMO USAR:  S = Propinas del día (ingresalas si te dieron) · T = Bono PY (ingresalo si te acreditaron uno) · U/V/W/X/Y = Se calculan solos con los datos del día · Z = Hora que empezaste a trabajar · AA = Hora que terminaste · AB = Tiempo de espera promedio entre pedidos (hs)';

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: '📅 Registro Diario!S3',
      valueInputOption: 'RAW',
      requestBody: { values: [[text]] },
    });

    return NextResponse.json({ ok: true, text });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    const text = '🚀 MÉTRICAS AVANZADAS:  S = Propinas (manual) · T = Bono PY (manual) · U = Gan/Hora (auto) · V = Gan/Pedido (auto) · W = Gan/KM (auto) · X = Costo/KM (auto) · Y = Pedidos/Hora (auto) · Z = Hora inicio · AA = Hora fin · AB = T. Espera (hs)';

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

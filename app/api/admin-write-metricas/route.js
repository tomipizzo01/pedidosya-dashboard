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

    const texto = '🚀 MÉTRICAS AVANZADAS:  S = Propinas recibidas (ingresarlas manualmente si las recibiste) · T = Bono PedidosYa (ingresarlo si te acreditaron uno) · U = Ganancia/Hora (se calcula sola: Ganancia Real ÷ Horas) · V = Ganancia/Pedido (se calcula sola: Ganancia Real ÷ Pedidos) · W = Ganancia/KM (se calcula sola: Ganancia Real ÷ KM) · X = Costo/KM (se calcula solo: Total Gastos ÷ KM) · Y = Pedidos/Hora (se calcula solo: Pedidos ÷ Horas) · Z = Hora de inicio de jornada · AA = Hora de fin de jornada · AB = Tiempo de espera entre pedidos (hs)';

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${HOJA}'!S3`,
      valueInputOption: 'RAW',
      requestBody: { values: [[texto]] },
    });

    return NextResponse.json({ ok: true, msg: '✅ Texto escrito en S3 de Registro Diario', texto });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

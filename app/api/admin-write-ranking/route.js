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

    // Generar fórmulas G6:G25 — solo cambia el número de fila (B{n} y C{n})
    const data = [];
    for (let n = 6; n <= 25; n++) {
      const formula = `=SI(O(B${n}="",C${n}=""),"",SI.ERROR(SUMAPRODUCTO(('📅 Turnos'!A6:A307>=B${n})*('📅 Turnos'!A6:A307<=C${n})*'📅 Turnos'!H6:H307),0))`;
      data.push({
        range: `'${HOJA}'!G${n}`,
        values: [[formula]],
      });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data,
      },
    });

    return NextResponse.json({
      ok: true,
      msg: `✅ Fórmulas aplicadas en G6:G25 de "${HOJA}"`,
      celdasActualizadas: data.length,
      ejemploG6: data[0].values[0][0],
      ejemploG25: data[data.length - 1].values[0][0],
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

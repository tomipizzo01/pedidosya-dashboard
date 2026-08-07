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

    const data = [];
    for (let n = 6; n <= 25; n++) {
      const formula = `=SI(O(B${n}="",C${n}=""),"",SI.ERROR(SUMAPRODUCTO(('📅 Turnos'!A6:A307>=B${n})*('📅 Turnos'!A6:A307<=C${n})*('📅 Turnos'!I6:I307="No")),0))`;
      data.push({ range: `'${HOJA}'!M${n}`, values: [[formula]] });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data },
    });

    return NextResponse.json({
      ok: true,
      msg: `✅ Fórmulas aplicadas en M6:M25 de "${HOJA}"`,
      celdasActualizadas: data.length,
      ejemploM6: data[0].values[0][0],
      ejemploM25: data[data.length - 1].values[0][0],
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

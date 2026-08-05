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
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export async function GET() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const sheets = await getSheetsClient();

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const all = meta.data.sheets;

  const toDelete = all.filter(s =>
    /mundial/i.test(s.properties.title) ||
    /⚽/.test(s.properties.title)
  );

  if (!toDelete.length) {
    return NextResponse.json({ ok: true, msg: 'No se encontraron hojas del Mundial.', sheets: all.map(s => s.properties.title) });
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: toDelete.map(s => ({ deleteSheet: { sheetId: s.properties.sheetId } }))
    }
  });

  return NextResponse.json({
    ok: true,
    msg: `Eliminadas: ${toDelete.map(s => s.properties.title).join(', ')}`,
    eliminadas: toDelete.map(s => s.properties.title),
    hojasRestantes: all.filter(s => !toDelete.find(d => d.properties.sheetId === s.properties.sheetId)).map(s => s.properties.title),
  });
}

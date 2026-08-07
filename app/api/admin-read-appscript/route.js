import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

async function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let credentials;
  try { credentials = JSON.parse(raw); } catch {
    const fixed = raw.replace(/"private_key"\s*:\s*"([\s\S]*?)"\s*,/, (m, pk) => m.replace(pk, pk.replace(/\n/g, '\\n')));
    credentials = JSON.parse(fixed);
  }
  if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/script.projects',
    ],
  });
}

export async function GET() {
  try {
    const auth = await getAuth();
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // Buscar el script vinculado al Spreadsheet via Drive API
    const drive = google.drive({ version: 'v3', auth });
    const driveRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.script' and parents in '${SHEET_ID}'`,
      fields: 'files(id, name)',
    });

    // Si no lo encuentra por parent, intentar buscar por nombre
    let scriptFiles = driveRes.data.files || [];

    if (scriptFiles.length === 0) {
      // Buscar script asociado buscando en todos los scripts
      const allScripts = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.script'`,
        fields: 'files(id, name)',
      });
      scriptFiles = allScripts.data.files || [];
    }

    return NextResponse.json({ scriptFiles, sheetId: SHEET_ID });
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}

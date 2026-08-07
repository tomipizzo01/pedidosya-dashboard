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

    // Intentar acceder al script con el ID del spreadsheet directamente
    const script = google.script({ version: 'v1', auth });
    const project = await script.projects.getContent({ scriptId: SHEET_ID });

    const files = project.data.files || [];
    return NextResponse.json({
      totalFiles: files.length,
      files: files.map(f => ({
        name: f.name,
        type: f.type,
        mundialLines: (f.source || '').split('\n')
          .map((line, i) => ({ n: i + 1, line }))
          .filter(({ line }) => /mundial|world.?cup|⚽|copa|fixture|grupo[s]?\s*(mundial|copa)/i.test(line)),
        totalLines: (f.source || '').split('\n').length,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

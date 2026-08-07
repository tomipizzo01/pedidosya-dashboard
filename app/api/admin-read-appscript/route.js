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
      'https://www.googleapis.com/auth/script.projects',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

const SCRIPT_ID = '1cRTO3NmZ6NJLrh1-Ud_Hwi1oJePe2chHac42d09TpdsZXDI_mkrkWQwn';
const MUNDIAL_RE = /mundial|world.?cup|⚽|fixture|grupo[s]?\s*(mundial|copa)/i;

export async function GET() {
  try {
    const auth = await getAuth();
    const script = google.script({ version: 'v1', auth });
    const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = res.data.files || [];

    return NextResponse.json({
      totalFiles: files.length,
      files: files.map(f => {
        const lines = (f.source || '').split('\n');
        return {
          name: f.name,
          type: f.type,
          totalLines: lines.length,
          mundialMatches: lines
            .map((line, i) => ({ n: i + 1, line: line.trim() }))
            .filter(({ line }) => MUNDIAL_RE.test(line)),
        };
      }),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

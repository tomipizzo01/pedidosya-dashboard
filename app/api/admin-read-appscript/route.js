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
    scopes: ['https://www.googleapis.com/auth/script.projects'],
  });
}

const SCRIPT_ID = '1cRTO3NmZ6NJLrh1-Ud_Hwi1oJePe2chHac42d09TpdsZXDI_mkrkWQwn';
const AFFECTED = ['EmailTemplates', 'Estadisticas', 'FormularioDiario', 'MejoresDatos', 'WebApp'];

export async function GET() {
  try {
    const auth = await getAuth();
    const script = google.script({ version: 'v1', auth });
    const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = res.data.files || [];

    const result = {};
    for (const f of files) {
      if (AFFECTED.includes(f.name)) {
        result[f.name] = f.source;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

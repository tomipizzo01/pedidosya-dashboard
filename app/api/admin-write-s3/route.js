import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

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

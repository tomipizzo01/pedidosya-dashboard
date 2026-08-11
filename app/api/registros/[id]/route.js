import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-options';
import { supabaseAdmin } from '../../../../lib/supabase';

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// GET /api/registros/[id]
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('registros_con_calculos')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ registro: data });
}

// PUT /api/registros/[id]
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();

  const payload = {};
  if (body.fecha !== undefined) {
    payload.fecha = body.fecha;
    const d = new Date(body.fecha + 'T12:00:00');
    payload.dia_semana = DIAS[d.getDay()];
  }
  const numFields = ['saldo_inicial','total_generado','efectivo','por_app','nafta','comida','otros_gastos','horas','km'];
  const intFields = ['pedidos','temperatura','energia'];
  const strFields = ['clima','notas'];

  numFields.forEach(f => { if (body[f] !== undefined) payload[f] = body[f] === '' ? null : parseFloat(body[f]) || 0; });
  intFields.forEach(f => { if (body[f] !== undefined) payload[f] = body[f] === '' ? null : parseInt(body[f]) || null; });
  strFields.forEach(f => { if (body[f] !== undefined) payload[f] = body[f] || null; });

  const { data, error } = await supabaseAdmin
    .from('registros_diarios')
    .update(payload)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ registro: data });
}

// DELETE /api/registros/[id]
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('registros_diarios')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

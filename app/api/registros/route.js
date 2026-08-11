import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-options';
import { supabaseAdmin } from '../../../lib/supabase';

function auth(req) {
  return getServerSession(authOptions);
}

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// GET /api/registros — lista todos los registros (orden desc)
export async function GET(req) {
  const session = await auth(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mes  = searchParams.get('mes');   // formato YYYY-MM
  const limit = parseInt(searchParams.get('limit') || '200');

  let query = supabaseAdmin
    .from('registros_con_calculos')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(limit);

  if (mes) {
    const [y, m] = mes.split('-');
    const desde = `${y}-${m}-01`;
    const hasta = new Date(y, m, 0).toISOString().slice(0,10);
    query = query.gte('fecha', desde).lte('fecha', hasta);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ registros: data });
}

// POST /api/registros — crear nuevo registro
export async function POST(req) {
  const session = await auth(req);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { fecha } = body;

  if (!fecha) return NextResponse.json({ error: 'fecha es requerida' }, { status: 400 });

  // Calcular día de la semana automáticamente
  const dateObj = new Date(fecha + 'T12:00:00');
  const dia_semana = DIAS[dateObj.getDay()];

  const payload = {
    fecha,
    dia_semana,
    saldo_inicial:  parseFloat(body.saldo_inicial)  || 0,
    total_generado: parseFloat(body.total_generado) || 0,
    efectivo:       parseFloat(body.efectivo)       || 0,
    por_app:        parseFloat(body.por_app)        || 0,
    nafta:          parseFloat(body.nafta)          || 0,
    comida:         parseFloat(body.comida)         || 0,
    otros_gastos:   parseFloat(body.otros_gastos)   || 0,
    horas:          body.horas    ? parseFloat(body.horas)    : null,
    pedidos:        body.pedidos  ? parseInt(body.pedidos)    : 0,
    km:             body.km       ? parseFloat(body.km)       : null,
    clima:          body.clima    || null,
    temperatura:    body.temperatura ? parseInt(body.temperatura) : null,
    energia:        body.energia  ? parseInt(body.energia)   : null,
    notas:          body.notas    || null,
  };

  const { data, error } = await supabaseAdmin
    .from('registros_diarios')
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ registro: data }, { status: 201 });
}

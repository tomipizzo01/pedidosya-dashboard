import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-options';
import { supabaseAdmin } from '../../../lib/supabase';

// GET /api/config
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('configuracion')
    .select('*')
    .order('id')
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}

// PUT /api/config
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();

  // Obtener id de la fila existente
  const { data: existing } = await supabaseAdmin
    .from('configuracion')
    .select('id')
    .order('id')
    .limit(1)
    .single();

  const n = (v, def) => (v != null && v !== '') ? parseFloat(v) : def;
  const payload = {
    nombre_cadete:               body.nombre_cadete               || null,
    zona_trabajo:                body.zona_trabajo                || null,
    meta_diaria:                 n(body.meta_diaria, 20000),
    meta_semanal:                n(body.meta_semanal, 130000),
    meta_mensual:                n(body.meta_mensual, 600000),
    horas_max_dia:               n(body.horas_max_dia, 10),
    precio_nafta:                n(body.precio_nafta, 1420),
    capacidad_tanque:            n(body.capacidad_tanque, 14),
    km_por_litro:                n(body.km_por_litro, 25),
    consumo_l_100km:             n(body.consumo_l_100km, 5.2),
    vehiculo:                    body.vehiculo    || 'Moto 150cc',
    ciudad:                      body.ciudad      || 'Tucumán',
    moneda:                      body.moneda      || 'ARS',
    email_reporte:               body.email_reporte               || null,
    whatsapp_numero:             body.whatsapp_numero             || null,
    enviar_reporte_automatico:   body.enviar_reporte_automatico   === true,
    reportes_semanales:          body.reportes_semanales !== false,
    reportes_mensuales:          body.reportes_mensuales !== false,
  };

  let result;
  if (existing?.id) {
    result = await supabaseAdmin
      .from('configuracion')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await supabaseAdmin
      .from('configuracion')
      .insert(payload)
      .select()
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ config: result.data });
}

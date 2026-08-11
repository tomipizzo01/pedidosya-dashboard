// Ruta de configuración inicial — solo funciona si NO existen usuarios todavía.
// Usarla UNA SOLA VEZ para crear el primer administrador.
// Después de crear el usuario, esta ruta queda bloqueada automáticamente.

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabase';

export async function POST(req) {
  try {
    // Verificar que no haya usuarios existentes
    const { count } = await supabaseAdmin
      .from('usuarios')
      .select('*', { count: 'exact', head: true });

    if (count > 0) {
      return NextResponse.json(
        { error: 'Ya existe al menos un usuario. El setup inicial está bloqueado.' },
        { status: 403 }
      );
    }

    const { username, password, nombre, email } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'username y password son requeridos.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        username: username.toLowerCase().trim(),
        password_hash: hash,
        nombre: nombre || username,
        email: email || null,
        rol: 'admin',
      })
      .select('id, username, nombre, rol')
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: `Usuario "${data.username}" creado exitosamente. Ya podés iniciar sesión.`,
      user: data,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

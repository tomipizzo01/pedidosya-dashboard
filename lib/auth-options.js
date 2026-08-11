import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './supabase';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        console.log('[auth] intentando login para:', credentials.username);

        const { data: user, error } = await supabaseAdmin
          .from('usuarios')
          .select('*')
          .eq('username', credentials.username.toLowerCase().trim())
          .eq('activo', true)
          .single();

        console.log('[auth] usuario encontrado:', user?.username, '| error:', error?.message);

        if (error || !user) return null;

        const ok = await bcrypt.compare(credentials.password, user.password_hash);
        console.log('[auth] bcrypt ok:', ok);
        if (!ok) return null;

        return {
          id:       user.id,
          username: user.username,
          nombre:   user.nombre,
          email:    user.email,
          rol:      user.rol,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.username = user.username;
        token.nombre   = user.nombre;
        token.rol      = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id       = token.id;
      session.user.username = token.username;
      session.user.nombre   = token.nombre;
      session.user.rol      = token.rol;
      return session;
    },
  },
  pages:   { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret:  process.env.NEXTAUTH_SECRET,
};

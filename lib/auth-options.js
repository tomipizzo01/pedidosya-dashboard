import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from './supabase';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',      type: 'email'    },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email:    credentials.email.toLowerCase().trim(),
          password: credentials.password,
        });

        if (error || !data?.user) return null;

        const u = data.user;
        return {
          id:     u.id,
          email:  u.email,
          nombre: u.user_metadata?.nombre || u.email.split('@')[0],
          rol:    u.user_metadata?.rol    || 'cadete',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id     = user.id;
        token.email  = user.email;
        token.nombre = user.nombre;
        token.rol    = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id     = token.id;
      session.user.email  = token.email;
      session.user.nombre = token.nombre;
      session.user.rol    = token.rol;
      return session;
    },
  },
  pages:   { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret:  process.env.NEXTAUTH_SECRET,
};
